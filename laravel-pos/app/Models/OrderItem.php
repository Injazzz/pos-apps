<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends BaseModel
{
    protected $fillable = [
        'order_id',
        'menu_id',
        'qty',
        'price',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'qty'        => 'integer',
            'price'      => 'decimal:2',
            'created_at' => 'datetime',
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

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    // =========================================================
    // ACCESSORS
    // =========================================================

    public function getSubtotalAttribute(): float
    {
        return $this->qty * $this->price;
    }

    public function getFormattedSubtotalAttribute(): string
    {
        return 'Rp ' . number_format($this->subtotal, 0, ',', '.');
    }

    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }
}
