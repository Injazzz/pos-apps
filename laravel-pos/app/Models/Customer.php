<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends BaseModel
{
    protected $fillable = [
        'user_id',
        'address',
        'city',
        'province',
        'postal_code',
        'notes',
    ];

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class, 'user_id', 'user_id');
    }

    // =========================================================
    // ACCESSORS
    // =========================================================

    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->province,
            $this->postal_code,
        ]);
        return implode(', ', $parts);
    }

    public function getNameAttribute(): string
    {
        return $this->user?->name ?? 'Unknown';
    }

    // =========================================================
    // SCOPES
    // =========================================================

    public function scopeWithUser($query)
    {
        return $query->with('user');
    }
}
