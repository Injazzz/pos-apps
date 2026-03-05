<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'     => User::factory()->pelanggan(),
            'address'     => fake()->address(),
            'city'        => fake()->city(),
            'province'    => fake()->state(),
            'postal_code' => fake()->postcode(),
            'notes'       => fake()->optional()->sentence(),
        ];
    }
}
