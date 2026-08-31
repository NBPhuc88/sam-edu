<?php

namespace Database\Seeders;

use App\Enums\Constant;
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
                'email'      => 'phuc.nb140198@gmail.com',
                'password'   => Hash::make('phuc140198'),
                'full_name'  => 'Quản Trị Viên',
                'phone'      => '0345544321',
                'role'       => Constant::ADMIN_ROLE_SUPER_ADMIN,
                'status'     => Constant::ADMIN_STATUS_ACTIVE,
            ]
        );
    }
}
