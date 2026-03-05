<?php

namespace App\Enums;

enum DeliveryStatus:string
{
    case WAITING    = 'waiting';
    case ASSIGNED   = 'assigned';
    case PICKED_UP  = 'picked_up';
    case ON_THE_WAY = 'on_the_way';
    case DELIVERED  = 'delivered';
    case FAILED     = 'failed';

    public function label(): string
    {
        return match($this) {
            DeliveryStatus::WAITING    => 'Menunggu Kurir',
            DeliveryStatus::ASSIGNED   => 'Kurir Ditugaskan',
            DeliveryStatus::PICKED_UP  => 'Pesanan Diambil Kurir',
            DeliveryStatus::ON_THE_WAY => 'Dalam Perjalanan',
            DeliveryStatus::DELIVERED  => 'Terkirim',
            DeliveryStatus::FAILED     => 'Gagal Kirim',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
