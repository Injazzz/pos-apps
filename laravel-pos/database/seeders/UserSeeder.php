<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── MANAGER ─────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'manager@pos.com'],
            [
                'name'              => 'Admin Manager',
                'password'          => Hash::make('password'),
                'role'              => UserRole::MANAGER->value,
                'phone'             => '081234567890',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // ── KASIR ────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'kasir@pos.com'],
            [
                'name'              => 'Kasir Satu',
                'password'          => Hash::make('password'),
                'role'              => UserRole::KASIR->value,
                'phone'             => '081234567891',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'kasir2@pos.com'],
            [
                'name'              => 'Kasir Dua',
                'password'          => Hash::make('password'),
                'role'              => UserRole::KASIR->value,
                'phone'             => '081234567892',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // ── KURIR ────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'kurir@pos.com'],
            [
                'name'              => 'Kurir Satu',
                'password'          => Hash::make('password'),
                'role'              => UserRole::KURIR->value,
                'phone'             => '081234567893',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'kurir2@pos.com'],
            [
                'name'              => 'Kurir Dua',
                'password'          => Hash::make('password'),
                'role'              => UserRole::KURIR->value,
                'phone'             => '081234567894',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // ── PELANGGAN (sample) ───────────────────────────
        $customers = [
            [
                'name'  => 'Budi Santoso',
                'email' => 'budi@example.com',
                'phone' => '081234567895',
            ],
            [
                'name'  => 'Siti Rahayu',
                'email' => 'siti@example.com',
                'phone' => '081234567896',
            ],
            [
                'name'  => 'Agus Setiawan',
                'email' => 'agus@example.com',
                'phone' => '081234567897',
            ],
        ];

        foreach ($customers as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => Hash::make('password'),
                    'role'              => UserRole::PELANGGAN->value,
                    'phone'             => $data['phone'],
                    'status'            => 'active',
                    'email_verified_at' => now(),
                ]
            );

            // Buat customer profile
            if (!$user->customer) {
                $user->customer()->create([
                    'address'     => fake()->address(),
                    'city'        => 'Jakarta',
                    'province'    => 'DKI Jakarta',
                    'postal_code' => '12345',
                ]);
            }
        }

        // Extra random users untuk development
        if (app()->environment('local')) {
            User::factory(5)->kasir()->create();
            User::factory(3)->kurir()->create();
            User::factory(20)->pelanggan()->create()->each(function (User $user) {
                if (!$user->customer) {
                    $user->customer()->create([
                        'address'     => fake()->address(),
                        'city'        => fake()->city(),
                        'province'    => fake()->state(),
                        'postal_code' => fake()->postcode(),
                    ]);
                }
            });
        }
    }
}
