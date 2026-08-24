<?php

namespace App\Services\Home;

use App\Repositories\Setting\SystemSettingRepositoryInterface;
use App\Repositories\Subscription\SubscriptionPlanRepositoryInterface;

class HomeService implements HomeServiceInterface
{
    public function __construct(
        protected SystemSettingRepositoryInterface $systemSettingRepository,
        protected SubscriptionPlanRepositoryInterface $subscriptionPlanRepository
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function getLandingPageData(): array
    {
        $heroTitle       = $this->systemSettingRepository->getByKey('hero_title', 'Giải Pháp Quản Lý Giáo Dục');
        $heroSubtitle    = $this->systemSettingRepository->getByKey('hero_subtitle', 'Hệ thống tối ưu hóa quy trình quản lý học sinh, sắp xếp lịch học, điểm danh thông minh và tự động gia hạn dịch vụ.');
        $promoBannerText = $this->systemSettingRepository->getByKey('promo_banner_text', 'Chương trình Khuyến Mãi 2026 - Giảm 30% khi đăng ký gói 1 năm + 14 ngày dùng thử miễn phí');

        $plans = $this->subscriptionPlanRepository->getAllOrderedByPrice();

        return [
            'hero' => [
                'title'    => $heroTitle,
                'subtitle' => $heroSubtitle,
            ],
            'promotionBanner' => $promoBannerText,
            'plans'           => $plans,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getServicesPageData(): array
    {
        $plans = $this->subscriptionPlanRepository->getAllOrderedByPrice();

        return [
            'plans' => $plans,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getAboutPageData(): array
    {
        $companyName = $this->systemSettingRepository->getByKey('company_name', 'Công ty Cổ phần SAM Digital');
        $address     = $this->systemSettingRepository->getByKey('contact_address', 'Tòa nhà Sam Tower, Hà Nội');

        return [
            'company' => [
                'name'    => $companyName,
                'address' => $address,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getContactPageData(): array
    {
        $companyName = $this->systemSettingRepository->getByKey('company_name', 'Công ty Cổ phần SAM Digital');
        $address     = $this->systemSettingRepository->getByKey('contact_address', 'Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Hà Nội');
        $phone       = $this->systemSettingRepository->getByKey('contact_phone', '0988.123.456');
        $email       = $this->systemSettingRepository->getByKey('contact_email', 'phucstt01@gmail.com');

        return [
            'contactInfo' => [
                'company_name' => $companyName,
                'address'      => $address,
                'phone'        => $phone,
                'email'        => $email,
            ],
            'enableOnlinePayment' => (bool) config('payment.enable_online_payment', false),
            'paymentGateways'     => config('payment.gateways', []),
        ];
    }
}
