<?php

namespace App\Models;

use App\Enums\DeliveryStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends BaseModel
{
    protected $fillable = [
        'order_id',
        'courier_id',
        'address',
        'recipient_name',
        'recipient_phone',
        'delivery_status',
        'proof_photo',
        'proof_taken_at',
        'latitude',
        'longitude',
        'delivery_notes',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'delivery_status' => DeliveryStatus::class,
            'proof_taken_at'  => 'datetime',
            'delivered_at'    => 'datetime',
            'latitude'        => 'decimal:8',
            'longitude'       => 'decimal:8',
            'created_at'      => 'datetime',
            'updated_at'      => 'datetime',
        ];
    }

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function courier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'courier_id');
    }

    // =========================================================
    // ACCESSORS
    // =========================================================

    public function getProofPhotoUrlAttribute(): ?string
    {
        return $this->proof_photo
            ? asset('storage/' . $this->proof_photo)
            : null;
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->delivery_status instanceof DeliveryStatus
            ? $this->delivery_status->label()
            : ucfirst($this->delivery_status ?? '');
    }

    public function getIsDeliveredAttribute(): bool
    {
        $status = $this->delivery_status instanceof DeliveryStatus
            ? $this->delivery_status->value
            : $this->delivery_status;
        return $status === DeliveryStatus::DELIVERED->value;
    }

    // =========================================================
    // SCOPES
    // =========================================================

    public function scopeAssigned($query)
    {
        return $query->whereNotNull('courier_id');
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('courier_id');
    }

    public function scopeByCourier($query, int $courierId)
    {
        return $query->where('courier_id', $courierId);
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('delivery_status', [
            DeliveryStatus::DELIVERED->value,
            DeliveryStatus::FAILED->value,
        ]);
    }
}
