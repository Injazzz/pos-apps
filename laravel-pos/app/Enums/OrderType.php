<?php

namespace App\Enums;

enum OrderType:string
{
    case DINE_IN    = 'dine_in';
    case TAKE_AWAY  = 'take_away';
    case DELIVERY   = 'delivery';

    public function label(): string
    {
        return match($this) {
            OrderType::DINE_IN   => 'Makan di Tempat',
            OrderType::TAKE_AWAY => 'Bawa Pulang',
            OrderType::DELIVERY  => 'Dikirim',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
