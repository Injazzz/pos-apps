<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Payment extends BaseModel
{
    use LogsActivity;

    protected $fillable = [
        'order_id',
        'method',
        'status',
        'amount',
        'dp_amount',
        'remaining_amount',
        'paid_amount',
        'cash_received',
        'change_amount',
        'midtrans_order_id',
        'midtrans_token',
        'midtrans_url',
        'midtrans_transaction_id',
        'midtrans_payment_type',
        'midtrans_response',
        'bank_name',
        'account_number',
        'transfer_proof',
        'paid_at',
        'expired_at',
        'processed_by',
    ];

    protected function casts(): array
    {
        return [
            'method'            => PaymentMethod::class,
            'status'            => PaymentStatus::class,
            'amount'            => 'decimal:2',
            'dp_amount'         => 'decimal:2',
            'remaining_amount'  => 'decimal:2',
            'paid_amount'       => 'decimal:2',
            'cash_received'     => 'decimal:2',
            'change_amount'     => 'decimal:2',
            'midtrans_response' => 'array',
            'paid_at'           => 'datetime',
            'expired_at'        => 'datetime',
            'created_at'        => 'datetime',
            'updated_at'        => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'method', 'paid_amount'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('payment');
    }

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // =========================================================
    // ACCESSORS
    // =========================================================

    public function getIsPaidAttribute(): bool
    {
        $status = $this->status instanceof PaymentStatus
            ? $this->status->value
            : $this->status;
        return $status === PaymentStatus::PAID->value;
    }

    public function getIsDownPaymentAttribute(): bool
    {
        $method = $this->method instanceof PaymentMethod
            ? $this->method->value
            : $this->method;
        return $method === PaymentMethod::DOWN_PAYMENT->value;
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->status instanceof PaymentStatus
            ? $this->status->label()
            : ucfirst($this->status ?? '');
    }

    public function getMethodLabelAttribute(): string
    {
        return $this->method instanceof PaymentMethod
            ? $this->method->label()
            : ucfirst($this->method ?? '');
    }

    public function getTransferProofUrlAttribute(): ?string
    {
        return $this->transfer_proof
            ? asset('storage/' . $this->transfer_proof)
            : null;
    }

    public function getFormattedAmountAttribute(): string
    {
        return 'Rp ' . number_format($this->amount, 0, ',', '.');
    }

    // =========================================================
    // SCOPES
    // =========================================================

    public function scopePaid($query)
    {
        return $query->where('status', PaymentStatus::PAID->value);
    }

    public function scopePending($query)
    {
        return $query->where('status', PaymentStatus::PENDING->value);
    }
}
