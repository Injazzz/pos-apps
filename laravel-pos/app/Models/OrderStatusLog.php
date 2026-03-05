<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderStatusLog extends BaseModel
{
    public $timestamps = false; // pakai updated_at manual

    protected $fillable = [
        'order_id',
        'status',
        'updated_by',
        'reason',
        'updated_by_role',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'status'     => OrderStatus::class,
            'updated_at' => 'datetime',
        ];
    }

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
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
}
