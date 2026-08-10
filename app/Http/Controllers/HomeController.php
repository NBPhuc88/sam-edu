<?php

namespace App\Http\Controllers;

use App\Http\Requests\Home\SubmitContactRequest;
use App\Models\ContactRequest;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Display official marketing landing page.
     */
    public function index(): Response
    {
        $heroTitle = SystemSetting::getByKey('hero_title', 'Giải Pháp Quản Lý Giáo Dục');
        $heroSubtitle = SystemSetting::getByKey('hero_subtitle', 'Hệ thống tối ưu hóa quy trình quản lý học sinh, sắp xếp lịch học, điểm danh thông minh và tự động gia hạn dịch vụ.');
        $promoBannerText = SystemSetting::getByKey('promo_banner_text', 'Chương trình Khuyến Mãi 2026 - Giảm 30% khi đăng ký gói 1 năm + 14 ngày dùng thử miễn phí');

        $plans = SubscriptionPlan::orderBy('price', 'asc')->get();

        return Inertia::render('Home/Index', [
            'hero' => [
                'title' => $heroTitle,
                'subtitle' => $heroSubtitle,
            ],
            'promotionBanner' => $promoBannerText,
            'plans' => $plans,
        ]);
    }

    /**
     * Display about company page.
     */
    public function about(): Response
    {
        $companyName = SystemSetting::getByKey('company_name', 'Công ty Cổ phần Giáo dục Sam');
        $address = SystemSetting::getByKey('contact_address', 'Tòa nhà Sam Tower, Hà Nội');

        return Inertia::render('Home/About', [
            'company' => [
                'name' => $companyName,
                'address' => $address,
            ],
        ]);
    }

    /**
     * Display contact page.
     */
    public function contact(): Response
    {
        $companyName = SystemSetting::getByKey('company_name', 'Công ty Cổ phần Giáo dục Sam');
        $address = SystemSetting::getByKey('contact_address', 'Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Hà Nội');
        $phone = SystemSetting::getByKey('contact_phone', '0988.123.456');
        $email = SystemSetting::getByKey('contact_email', 'hotro@giaoducsam.vn');

        return Inertia::render('Home/Contact', [
            'contactInfo' => [
                'company_name' => $companyName,
                'address' => $address,
                'phone' => $phone,
                'email' => $email,
            ],
        ]);
    }

    /**
     * Submit contact consultation request.
     */
    public function submitContact(SubmitContactRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        ContactRequest::create([
            'full_name' => $validated['full_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'center_name' => $validated['center_name'] ?? null,
            'message' => $validated['message'] ?? null,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Yêu cầu tư vấn của bạn đã được gửi thành công. Đội ngũ Giáo Dục Sam sẽ liên hệ lại trong thời gian sớm nhất!');
    }
}
