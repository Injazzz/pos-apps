<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends BaseModel
{
    protected $fillable = [
        'order_id',
        'customer_id',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating'     => 'integer',
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    // =========================================================
    // ACCESSORS
    // =========================================================

    public function getStarsAttribute(): string
    {
        return str_repeat('⭐', $this->rating);
    }

    // =========================================================
    // SCOPES
    // =========================================================

    public function scopeHighRated($query, int $min = 4)
    {
        return $query->where('rating', '>=', $min);
    }
}
