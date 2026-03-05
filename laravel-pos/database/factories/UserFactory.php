<?php

namespace Database\Factories;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'password'          => Hash::make('password'),
            'role'              => fake()->randomElement(UserRole::values()),
            'phone'             => fake()->numerify('08##########'),
            'status'            => 'active',
            'email_verified_at' => now(),
        ];
    }

    // States per role
    public function manager(): static
    {
        return $this->state(['role' => UserRole::MANAGER->value]);
    }

    public function kasir(): static
    {
        return $this->state(['role' => UserRole::KASIR->value]);
    }

    public function kurir(): static
    {
        return $this->state(['role' => UserRole::KURIR->value]);
    }

    public function pelanggan(): static
    {
        return $this->state(['role' => UserRole::PELANGGAN->value]);
    }

    public function inactive(): static
    {
        return $this->state(['status' => 'inactive']);
    }
}
