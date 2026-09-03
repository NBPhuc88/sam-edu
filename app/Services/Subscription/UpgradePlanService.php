<?php

namespace App\Services\Subscription;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Subscription\SubscriptionPlanRepositoryInterface;
use Illuminate\Contracts\Auth\Authenticatable;

class UpgradePlanService implements UpgradePlanServiceInterface
{
    public function __construct(
        protected CenterRepositoryInterface $centerRepository,
        protected SubscriptionPlanRepositoryInterface $subscriptionPlanRepository
    ) {
    }

    /**
     * Lấy dữ liệu hiển thị cho trang thông báo nâng cấp gói dịch vụ.
     *
     * @param  Authenticatable|null $user
     * @param  string|null          $featureKey
     * @return array<string, mixed>
     */
    public function getUpgradePlanData(?Authenticatable $user, ?string $featureKey = null): array
    {
        $center = $this->resolveCenter($user);

        $featureKey = is_string($featureKey) && $featureKey !== '' ? $featureKey : 'general';
        /** @var array<string, mixed>|null $featureDef */
        $featureDef = config("plan_features.features.{$featureKey}");

        $isExpired = $center && $center->expires_at && $center->expires_at->isPast();

        $planName      = $center?->plan_name ?? 'Gói Cơ Bản';
        $currentPlanId = $center?->subscription_plan_id;
        $planType      = $center?->plan_type ?? Constant::PLAN_TYPE_FREE;

        $title = $isExpired
            ? 'Gói Dịch Vụ Của Trung Tâm Đã Hết Hạn'
            : ($featureDef ? "Nâng Cấp Gói Để Sử Dụng '{$featureDef['name']}'" : 'Tính Năng Yêu Cầu Nâng Cấp Gói');

        $message = $isExpired
            ? 'Gói dịch vụ của trung tâm đã hết hạn sử dụng. Vui lòng liên hệ Quản trị viên hệ thống để gia hạn và tiếp tục vận hành.'
            : ($featureDef
                ? "Tính năng '{$featureDef['name']}' ({$featureDef['description']}) chỉ có trong Gói Nâng Cao. Vui lòng liên hệ Quản trị viên hệ thống để nâng cấp gói cho trung tâm của bạn."
                : 'Tính năng này yêu cầu trung tâm nâng cấp lên gói Nâng Cao để sử dụng.');

        return [
            'status'        => 403,
            'reason'        => $isExpired ? 'expired' : 'feature_locked',
            'title'         => $title,
            'feature'       => $featureKey,
            'featureName'   => $featureDef['name'] ?? 'Tính Năng Nâng Cao',
            'message'       => $message,
            'currentPlan'   => $planName,
            'currentPlanId' => $currentPlanId,
            'planType'      => $planType,
            'requiredPlan'  => 'advanced',
        ];
    }

    /**
     * Xác định Center tương ứng với tài khoản người dùng hiện tại.
     * @param ?Authenticatable $user
     */
    protected function resolveCenter(?Authenticatable $user): ?Center
    {
        if (! $user) {
            return null;
        }

        if ($user instanceof Teacher || $user instanceof Student) {
            if ($user->center) {
                return $user->center;
            }

            if ($user->center_id) {
                return $this->centerRepository->find((int) $user->center_id);
            }

            return null;
        }

        if ($user instanceof Admin) {
            return $user->centers()->first();
        }

        return null;
    }
}
