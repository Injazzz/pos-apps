<?php
// app/Models/Menu.php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Menu extends BaseModel
{
    use SoftDeletes, LogsActivity;

    protected $fillable = [
        'name',
        'price',
        'category',
        'description',
        'image_path',
        'is_available',
        'stock',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price'        => 'decimal:2',
            'is_available' => 'boolean',
            'image_path'  => 'array',
            'stock'        => 'integer',
            'sort_order'   => 'integer',
            'created_at'   => 'datetime',
            'updated_at'   => 'datetime',
            'deleted_at'   => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'price', 'category', 'is_available'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('menu');
    }

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    // =========================================================
    // ACCESSORS
    // =========================================================

    public function getImageUrlAttribute(): string
    {
        if (!$this->image_path) {
            // Placeholder berdasarkan kategori
            return asset('images/menu-placeholder.png');
        }

        return str_starts_with($this->image_path, 'http')
            ? $this->image_path
            : asset('storage/' . $this->image_path);
    }

    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }

    public function getIsInStockAttribute(): bool
    {
        if (is_null($this->stock)) {
            return true; // unlimited stock
        }
        return $this->stock > 0;
    }

    // =========================================================
    // SCOPES
    // =========================================================

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeSearch($query, string $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('name', 'LIKE', "%{$keyword}%")
              ->orWhere('description', 'LIKE', "%{$keyword}%")
              ->orWhere('category', 'LIKE', "%{$keyword}%");
        });
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
