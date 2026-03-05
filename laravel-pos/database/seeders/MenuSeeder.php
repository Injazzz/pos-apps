<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            // ── MAKANAN BERAT ─────────────────────────────
            [
                'name'        => 'Nasi Goreng Spesial',
                'price'       => 25000,
                'category'    => 'Makanan Berat',
                'description' => 'Nasi goreng dengan telur, ayam, dan sayuran segar',
                'is_available'=> true,
                'sort_order'  => 1,
            ],
            [
                'name'        => 'Mie Goreng Jumbo',
                'price'       => 22000,
                'category'    => 'Makanan Berat',
                'description' => 'Mie goreng porsi besar dengan topping lengkap',
                'is_available'=> true,
                'sort_order'  => 2,
            ],
            [
                'name'        => 'Ayam Geprek Sambal Bawang',
                'price'       => 28000,
                'category'    => 'Makanan Berat',
                'description' => 'Ayam crispy geprek dengan sambal bawang khas',
                'is_available'=> true,
                'sort_order'  => 3,
            ],
            [
                'name'        => 'Nasi Uduk Komplit',
                'price'       => 20000,
                'category'    => 'Makanan Berat',
                'description' => 'Nasi uduk dengan lauk ayam goreng, tempe, tahu',
                'is_available'=> true,
                'sort_order'  => 4,
            ],
            [
                'name'        => 'Soto Ayam Lamongan',
                'price'       => 18000,
                'category'    => 'Makanan Berat',
                'description' => 'Soto ayam dengan kuah bening khas Lamongan',
                'is_available'=> true,
                'sort_order'  => 5,
            ],
            [
                'name'        => 'Bakso Malang Komplit',
                'price'       => 20000,
                'category'    => 'Makanan Berat',
                'description' => 'Bakso urat, bakso halus, tahu, dan mie',
                'is_available'=> true,
                'sort_order'  => 6,
            ],

            // ── MAKANAN RINGAN ────────────────────────────
            [
                'name'        => 'Kentang Goreng Crispy',
                'price'       => 12000,
                'category'    => 'Makanan Ringan',
                'description' => 'Kentang goreng crispy dengan saus sambal',
                'is_available'=> true,
                'sort_order'  => 7,
            ],
            [
                'name'        => 'Pisang Goreng Madu',
                'price'       => 10000,
                'category'    => 'Makanan Ringan',
                'description' => 'Pisang goreng krispi dengan topping madu',
                'is_available'=> true,
                'sort_order'  => 8,
            ],
            [
                'name'        => 'Tahu Crispy Pedas',
                'price'       => 8000,
                'category'    => 'Makanan Ringan',
                'description' => 'Tahu goreng crispy bumbu pedas',
                'is_available'=> true,
                'sort_order'  => 9,
            ],

            // ── MINUMAN ───────────────────────────────────
            [
                'name'        => 'Es Teh Manis',
                'price'       => 5000,
                'category'    => 'Minuman',
                'description' => 'Teh manis segar dengan es batu',
                'is_available'=> true,
                'sort_order'  => 10,
            ],
            [
                'name'        => 'Es Jeruk Peras',
                'price'       => 8000,
                'category'    => 'Minuman',
                'description' => 'Jeruk peras segar dengan es batu',
                'is_available'=> true,
                'sort_order'  => 11,
            ],
            [
                'name'        => 'Jus Alpukat',
                'price'       => 15000,
                'category'    => 'Minuman',
                'description' => 'Jus alpukat segar dengan susu kental manis',
                'is_available'=> true,
                'sort_order'  => 12,
            ],
            [
                'name'        => 'Kopi Susu Kekinian',
                'price'       => 18000,
                'category'    => 'Minuman',
                'description' => 'Kopi susu dengan gula aren pilihan',
                'is_available'=> true,
                'sort_order'  => 13,
            ],
            [
                'name'        => 'Teh Tarik',
                'price'       => 10000,
                'category'    => 'Minuman',
                'description' => 'Teh tarik ala mamak',
                'is_available'=> true,
                'sort_order'  => 14,
            ],
            [
                'name'        => 'Air Mineral',
                'price'       => 4000,
                'category'    => 'Minuman',
                'description' => 'Air mineral dingin',
                'is_available'=> true,
                'sort_order'  => 15,
            ],

            // ── DESSERT ───────────────────────────────────
            [
                'name'        => 'Es Campur Spesial',
                'price'       => 15000,
                'category'    => 'Dessert',
                'description' => 'Es campur dengan buah-buahan segar',
                'is_available'=> true,
                'sort_order'  => 16,
            ],
            [
                'name'        => 'Pudding Coklat',
                'price'       => 10000,
                'category'    => 'Dessert',
                'description' => 'Pudding coklat lembut dengan vla vanilla',
                'is_available'=> true,
                'sort_order'  => 17,
            ],
            [
                'name'        => 'Es Krim 2 Scoop',
                'price'       => 18000,
                'category'    => 'Dessert',
                'description' => 'Es krim 2 rasa pilihan',
                'is_available'=> false, // contoh item tidak tersedia
                'sort_order'  => 18,
            ],

            // ── PAKET HEMAT ───────────────────────────────
            [
                'name'        => 'Paket Hemat A (Nasi + Lauk + Es Teh)',
                'price'       => 30000,
                'category'    => 'Paket Hemat',
                'description' => 'Nasi goreng spesial + es teh manis',
                'is_available'=> true,
                'sort_order'  => 19,
            ],
            [
                'name'        => 'Paket Hemat B (Ayam + Nasi + Minuman)',
                'price'       => 35000,
                'category'    => 'Paket Hemat',
                'description' => 'Ayam geprek + nasi + es teh manis',
                'is_available'=> true,
                'sort_order'  => 20,
            ],
        ];

        foreach ($menus as $menu) {
            Menu::firstOrCreate(
                ['name' => $menu['name']],
                $menu
            );
        }
    }
}
