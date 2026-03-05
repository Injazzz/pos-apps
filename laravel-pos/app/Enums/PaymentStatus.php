<?php

namespace App\Enums;

enum PaymentStatus:string
{
    case PENDING    = 'pending';
    case PARTIAL    = 'partial';       // untuk DP
    case PAID       = 'paid';
    case FAILED     = 'failed';
    case REFUNDED   = 'refunded';
    case EXPIRED    = 'expired';

    public function label(): string
    {
        return match($this) {
            PaymentStatus::PENDING  => 'Menunggu Pembayaran',
            PaymentStatus::PARTIAL  => 'DP Dibayar',
            PaymentStatus::PAID     => 'Lunas',
            PaymentStatus::FAILED   => 'Gagal',
            PaymentStatus::REFUNDED => 'Dikembalikan',
            PaymentStatus::EXPIRED  => 'Kadaluarsa',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
