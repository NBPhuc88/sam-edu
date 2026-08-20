<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SystemContentSeeder::class,
            SeoMetadataSeeder::class,
            TestCenterSeeder::class,
        ]);
    }

    /**
     * Seed dữ liệu test (trung tâm mẫu).
     * Chạy riêng: php artisan db:seed --class=TestCenterSeeder
     */
    public function runTest(): void
    {
        $this->call([
            TestCenterSeeder::class,
        ]);
    }
}
