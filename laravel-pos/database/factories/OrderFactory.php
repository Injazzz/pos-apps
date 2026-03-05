<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        $orderType = fake()->randomElement(OrderType::values());
        $status    = fake()->randomElement(OrderStatus::values());

        return [
            'order_code'      => 'ORD-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
            'customer_id'     => Customer::factory(),
            'cashier_id'      => User::factory()->kasir(),
            'order_type'      => $orderType,
            'status'          => $status,
            'subtotal'        => $subtotal = fake()->numberBetween(20000, 500000),
            'discount'        => 0,
            'total_price'     => $subtotal,
            'delivery_fee'    => $orderType === 'delivery' ? 10000 : 0,
            'source'          => fake()->randomElement(['app', 'kasir', 'whatsapp']),
            'notes'           => fake()->optional()->sentence(),
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => OrderStatus::PENDING->value]);
    }

    public function processing(): static
    {
        return $this->state(['status' => OrderStatus::PROCESSING->value]);
    }

    public function completed(): static
    {
        return $this->state(['status' => OrderStatus::COMPLETED->value]);
    }
}
