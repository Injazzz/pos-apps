<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,     // Users dulu (ada FK ke users)
            MenuSeeder::class,     // Menu
            // OrderSeeder bisa ditambah nanti untuk sample data
        ]);

        $this->command->info('✅ Database seeded successfully!');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Manager',   'manager@pos.com', 'password'],
                ['Kasir',     'kasir@pos.com',   'password'],
                ['Kasir 2',   'kasir2@pos.com',  'password'],
                ['Kurir',     'kurir@pos.com',   'password'],
                ['Pelanggan', 'budi@example.com','password'],
            ]
        );
    }
}
