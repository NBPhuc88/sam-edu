<?php

namespace App\Services\Subscription;

use Illuminate\Contracts\Auth\Authenticatable;

interface UpgradePlanServiceInterface
{
    /**
     * Lấy dữ liệu hiển thị cho trang thông báo nâng cấp gói dịch vụ.
     *
     * @param  Authenticatable|null $user
     * @param  string|null          $featureKey
     * @return array<string, mixed>
     */
    public function getUpgradePlanData(?Authenticatable $user, ?string $featureKey = null): array;
}
