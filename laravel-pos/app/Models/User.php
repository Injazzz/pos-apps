<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Delivery;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\CausesActivity;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable
{
    use HasApiTokens,
        HasFactory,
        Notifiable,
        SoftDeletes,
        CausesActivity,
        LogsActivity;

    // ─── Fillable ────────────────────────────────────────────────
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'status',
        'google_id',
        'avatar',
        'email_verified_at',
    ];

    // ─── Hidden ──────────────────────────────────────────────────
    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];

    // ─── Casts ───────────────────────────────────────────────────
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'role'              => UserRole::class,
            'created_at'        => 'datetime',
            'updated_at'        => 'datetime',
            'deleted_at'        => 'datetime',
        ];
    }

    // ─── Activity Log Config ─────────────────────────────────────
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'role', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('user');
    }

    // =========================================================
    // RELATIONSHIPS
    // =========================================================

    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'cashier_id');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'courier_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class, 'updated_by');
    }

    // =========================================================
    // SCOPES
    // =========================================================

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByRole($query, string|UserRole $role)
    {
        $value = $role instanceof UserRole ? $role->value : $role;
        return $query->where('role', $value);
    }

    public function scopeKasir($query)
    {
        return $query->where('role', UserRole::KASIR->value);
    }

    public function scopeKurir($query)
    {
        return $query->where('role', UserRole::KURIR->value);
    }

    public function scopePelanggan($query)
    {
        return $query->where('role', UserRole::PELANGGAN->value);
    }

    public function scopeManager($query)
    {
        return $query->where('role', UserRole::MANAGER->value);
    }

    // =========================================================
    // ACCESSORS & HELPERS
    // =========================================================

    public function getRoleLabelAttribute(): string
    {
        return $this->role instanceof UserRole
            ? $this->role->label()
            : ucfirst($this->role ?? '');
    }

    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            return str_starts_with($this->avatar, 'http')
                ? $this->avatar
                : asset('storage/' . $this->avatar);
        }

        // Default gravatar
        $hash = md5(strtolower(trim($this->email)));
        return "https://www.gravatar.com/avatar/{$hash}?d=identicon&s=200";
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }

    // ─── Role checker helpers ─────────────────────────────────
    public function isManager(): bool
    {
        return $this->role === UserRole::MANAGER
            || $this->role->value === UserRole::MANAGER->value;
    }

    public function isKasir(): bool
    {
        $role = $this->role instanceof UserRole
            ? $this->role->value
            : $this->role;
        return $role === UserRole::KASIR->value;
    }

    public function isKurir(): bool
    {
        $role = $this->role instanceof UserRole
            ? $this->role->value
            : $this->role;
        return $role === UserRole::KURIR->value;
    }

    public function isPelanggan(): bool
    {
        $role = $this->role instanceof UserRole
            ? $this->role->value
            : $this->role;
        return $role === UserRole::PELANGGAN->value;
    }

    public function hasRole(string ...$roles): bool
    {
        $currentRole = $this->role instanceof UserRole
            ? $this->role->value
            : $this->role;
        return in_array($currentRole, $roles);
    }
}
