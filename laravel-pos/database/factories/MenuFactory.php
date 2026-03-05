<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class MenuFactory extends Factory
{
    private static array $categories = [
        'Makanan Berat',
        'Makanan Ringan',
        'Minuman',
        'Dessert',
        'Paket Hemat',
    ];

    private static array $foods = [
        'Nasi Goreng Spesial', 'Mie Goreng Jumbo', 'Ayam Bakar Madu',
        'Soto Ayam', 'Bakso Malang', 'Gado-Gado', 'Pecel Lele',
        'Nasi Uduk', 'Ayam Geprek', 'Burger Spesial',
        'Es Teh Manis', 'Jus Alpukat', 'Es Jeruk', 'Kopi Susu',
        'Teh Tarik', 'Es Campur', 'Pudding Coklat', 'Onde-Onde',
    ];

    public function definition(): array
    {
        return [
            'name'         => fake()->unique()->randomElement(self::$foods),
            'price'        => fake()->randomElement([
                5000, 8000, 10000, 12000, 15000, 18000,
                20000, 25000, 30000, 35000, 40000, 50000,
            ]),
            'category'     => fake()->randomElement(self::$categories),
            'description'  => fake()->sentence(10),
            'is_available' => fake()->boolean(85), // 85% tersedia
            'sort_order'   => fake()->numberBetween(1, 100),
        ];
    }

    public function available(): static
    {
        return $this->state(['is_available' => true]);
    }

    public function unavailable(): static
    {
        return $this->state(['is_available' => false]);
    }
}
