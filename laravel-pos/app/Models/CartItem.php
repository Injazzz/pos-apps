<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends BaseModel
{
    protected $fillable = [
        'user_id',
        'menu_id',
        'qty',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'qty'        => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
        return $this->qty * ($this->menu?->price ?? 0);
    }
}
