<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Seed the primary Super Admin account.
     */
    public function run(): void
    {
        Admin::updateOrCreate(
            ['username' => 'super_admin'],
            [
                'admin_code' => 'ADM000000000',
                'username'   => 'super_admin',
                'email'      => 'superadmin@sam-edu.vn',
                'password'   => Hash::make('password'),
                'full_name'  => 'Ban Quản Trị Tối Cao',
                'phone'      => '0900000000',
                'role'       => 'super_admin',
                'status'     => 'active',
            ]
        );
    }
}
