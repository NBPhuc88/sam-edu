<?php

use App\Models\Admin;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'SubscriptionPlanSeeder']);
    Artisan::call('db:seed', ['--class' => 'PermissionSeeder']);
});

test('super admin can access settings page', function () {
    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-99',
        'username'   => 'super_admin_setting',
        'email'      => 'super_setting@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Setting',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')->get(route('settings.index'));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('Admin/Settings/Index')
            ->has('settings')
            ->has('seo')
    );
});

test('super admin can update system settings and seo metadata', function () {
    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-98',
        'username'   => 'super_admin_setting2',
        'email'      => 'super_setting2@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Setting 2',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')->post(route('settings.update'), [
        'settings' => [
            'company_name'      => 'Công ty Giáo Dục Sam Mới',
            'contact_phone'     => '0999.888.777',
            'contact_email'     => 'contact@sam-edu.vn',
            'contact_address'   => 'Hà Nội Mới',
            'hero_title'        => 'Nền tảng Giáo dục 2026',
            'hero_subtitle'     => 'Mô tả chi tiết nền tảng',
            'promo_banner_text' => 'Khuyến mãi đặc biệt 50%',
        ],
        'seo' => [
            'home' => [
                'title'         => 'Trang Chủ Sam Edu Mới',
                'description'   => 'Mô tả SEO trang chủ mới',
                'keywords'      => 'sam, edu, 2026',
                'og_image'      => 'https://sam-edu.vn/og.png',
                'canonical_url' => 'https://sam-edu.vn',
            ],
        ],
    ]);

    $response->assertRedirect(route('settings.index'));
    $response->assertSessionHas('success');

    expect(SystemSetting::getByKey('company_name'))->toBe('Công ty Giáo Dục Sam Mới');
    expect(SystemSetting::getByKey('contact_phone'))->toBe('0999.888.777');
    expect(SystemSetting::getByKey('hero_title'))->toBe('Nền tảng Giáo dục 2026');
});
