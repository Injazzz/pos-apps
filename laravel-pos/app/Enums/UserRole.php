<?php

namespace App\Enums;

enum UserRole: string
{
    case MANAGER    = 'manager';
    case KASIR      = 'kasir';
    case KURIR      = 'kurir';
    case PELANGGAN  = 'pelanggan';

    public function label(): string
    {
        return match($this) {
            UserRole::MANAGER   => 'Manager',
            UserRole::KASIR     => 'Kasir',
            UserRole::KURIR     => 'Kurir',
            UserRole::PELANGGAN => 'Pelanggan',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
