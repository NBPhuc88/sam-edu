<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with core system data only.
     */
    public function run(): void
    {
        $this->call([
            SuperAdminSeeder::class,
            SystemContentSeeder::class,
        ]);
    }
}
