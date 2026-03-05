<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Order extends BaseModel
{
    use SoftDeletes, LogsActivity;

    protected $fillable = [
        'order_code',
        'customer_id',
        'cashier_id',
        'order_type',
        'status',
        'subtotal',
        'discount',
        'total_price',
        'delivery_address',
        'delivery_fee',
        'customer_name',
        'customer_phone',
        'notes',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'order_type'   => OrderType::class,
            'status'       => OrderStatus::class,
            'subtotal'     => 'decimal:2',
            'discount'     => 'decimal:2',
            'total_price'  => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'created_at'   => 'datetime',
            'updated_at'   => 'datetime',
            'deleted_at'   => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'cashier_id', 'total_price'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('order');
    }

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function delivery(): HasOne
    {
        return $this->hasOne(Delivery::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class)
                    ->orderBy('updated_at', 'desc');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    // =========================================================
    // ACCESSORS
    // =========================================================

    public function getStatusLabelAttribute(): string
    {
        return $this->status instanceof OrderStatus
            ? $this->status->label()
            : ucfirst($this->status ?? '');
    }

    public function getOrderTypeLabelAttribute(): string
    {
        return $this->order_type instanceof OrderType
            ? $this->order_type->label()
            : ucfirst($this->order_type ?? '');
    }

    public function getFormattedTotalAttribute(): string
    {
        return 'Rp ' . number_format($this->total_price, 0, ',', '.');
    }

    public function getCustomerDisplayNameAttribute(): string
    {
        // Prioritas: nama dari relasi customer -> customer_name field -> 'Guest'
        return $this->customer?->user?->name
            ?? $this->customer_name
            ?? 'Tamu';
    }

    public function getCustomerDisplayPhoneAttribute(): string
    {
        return $this->customer?->user?->phone
            ?? $this->customer_phone
            ?? '-';
    }

    public function getIsPaidAttribute(): bool
    {
        return $this->payment?->status === 'paid'
            || $this->payment?->status === 'partial';
    }

    public function getCanBeCancelledAttribute(): bool
    {
        $currentStatus = $this->status instanceof OrderStatus
            ? $this->status->value
            : $this->status;

        return in_array($currentStatus, [
            OrderStatus::PENDING->value,
            OrderStatus::PROCESSING->value,
        ]);
    }

    // =========================================================
    // SCOPES
    // =========================================================

    public function scopeByStatus($query, string|OrderStatus $status)
    {
        $value = $status instanceof OrderStatus ? $status->value : $status;
        return $query->where('status', $value);
    }

    public function scopePending($query)
    {
        return $query->where('status', OrderStatus::PENDING->value);
    }

    public function scopeActive($query)
    {
        // Order yang sedang dalam proses (belum selesai/cancel)
        return $query->whereNotIn('status', [
            OrderStatus::COMPLETED->value,
            OrderStatus::CANCELLED->value,
        ]);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month)
                     ->whereYear('created_at', now()->year);
    }

    public function scopeDateRange($query, string $from, string $to)
    {
        return $query->whereBetween('created_at', [
            $from . ' 00:00:00',
            $to . ' 23:59:59',
        ]);
    }

    public function scopeDelivery($query)
    {
        return $query->where('order_type', OrderType::DELIVERY->value);
    }

    public function scopeWithFullDetails($query)
    {
        return $query->with([
            'customer.user',
            'cashier',
            'items.menu',
            'payment',
            'delivery.courier',
            'statusLogs.updater',
        ]);
    }

    // =========================================================
    // METHODS
    // =========================================================

    /**
     * Cek apakah transisi status valid
     */
    public function canTransitionTo(OrderStatus $newStatus): bool
    {
        $current = $this->status instanceof OrderStatus
            ? $this->status
            : OrderStatus::from($this->status);

        return $current->canTransitionTo($newStatus);
    }

    /**
     * Generate order code unik
     */
    public static function generateOrderCode(): string
    {
        $prefix = 'ORD-' . now()->format('Ymd') . '-';
        $lastOrder = static::where('order_code', 'LIKE', $prefix . '%')
            ->orderByDesc('id')
            ->first();

        if (!$lastOrder) {
            return $prefix . '0001';
        }

        $lastNumber = (int) substr($lastOrder->order_code, -4);
        return $prefix . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
    }
}
