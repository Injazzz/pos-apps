<?php

namespace App\Enums;

enum OrderStatus:string
{
    case PENDING        = 'pending';
    case PROCESSING     = 'processing';
    case COOKING        = 'cooking';
    case READY          = 'ready';
    case ON_DELIVERY    = 'on_delivery';
    case DELIVERED      = 'delivered';
    case COMPLETED      = 'completed';
    case CANCELLED      = 'cancelled';

    public function label(): string
    {
        return match($this) {
            OrderStatus::PENDING      => 'Menunggu Konfirmasi',
            OrderStatus::PROCESSING   => 'Diproses Kasir',
            OrderStatus::COOKING      => 'Sedang Dimasak',
            OrderStatus::READY        => 'Siap Diambil/Dikirim',
            OrderStatus::ON_DELIVERY  => 'Sedang Diantar',
            OrderStatus::DELIVERED    => 'Telah Diantar',
            OrderStatus::COMPLETED    => 'Selesai',
            OrderStatus::CANCELLED    => 'Dibatalkan',
        };
    }

    /**
     * Validasi apakah transisi status valid
     */
    public function canTransitionTo(OrderStatus $newStatus): bool
    {
        $allowedTransitions = [
            self::PENDING->value     => [self::PROCESSING->value, self::CANCELLED->value],
            self::PROCESSING->value  => [self::COOKING->value, self::CANCELLED->value],
            self::COOKING->value     => [self::READY->value],
            self::READY->value       => [self::ON_DELIVERY->value, self::COMPLETED->value],
            self::ON_DELIVERY->value => [self::DELIVERED->value],
            self::DELIVERED->value   => [self::COMPLETED->value],
            self::COMPLETED->value   => [],
            self::CANCELLED->value   => [],
        ];

        return in_array($newStatus->value, $allowedTransitions[$this->value] ?? []);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
