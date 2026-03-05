<?php

namespace App\Enums;

enum PaymentMethod:string
{
    case CASH           = 'cash';
    case TRANSFER_BANK  = 'transfer_bank';
    case QRIS           = 'qris';
    case DOWN_PAYMENT   = 'down_payment';
    case MIDTRANS       = 'midtrans';

    public function label(): string
    {
        return match($this) {
            PaymentMethod::CASH          => 'Tunai',
            PaymentMethod::TRANSFER_BANK => 'Transfer Bank',
            PaymentMethod::QRIS          => 'QRIS',
            PaymentMethod::DOWN_PAYMENT  => 'Uang Muka (DP)',
            PaymentMethod::MIDTRANS      => 'Midtrans (Online)',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
