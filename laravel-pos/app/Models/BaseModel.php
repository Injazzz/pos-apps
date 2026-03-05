<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

abstract class BaseModel extends Model
{
    use HasFactory;

    /**
     * Default: semua field tidak boleh mass-assigned
     * kecuali yang ada di $fillable masing-masing model
     */
    protected $guarded = [];

    /**
     * Semua model auto-cast timestamps
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
