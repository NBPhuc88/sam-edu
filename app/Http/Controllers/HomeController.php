<?php

namespace App\Http\Controllers;

use App\Http\Requests\Home\SubmitContactRequest;
use App\Services\Home\ContactRequestServiceInterface;
use App\Services\Home\HomeServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        protected HomeServiceInterface $homeService,
        protected ContactRequestServiceInterface $contactRequestService
    ) {
    }

    /**
     * Display official marketing landing page.
     */
    public function index(): Response
    {
        $data = $this->homeService->getLandingPageData();

        return Inertia::render('Home/Index', $data);
    }

    /**
     * Display software subscription plans and services page.
     */
    public function services(): Response
    {
        $data = $this->homeService->getServicesPageData();

        return Inertia::render('Home/Services', $data);
    }

    /**
     * Display about company page.
     */
    public function about(): Response
    {
        $data = $this->homeService->getAboutPageData();

        return Inertia::render('Home/About', $data);
    }

    /**
     * Display contact page.
     */
    public function contact(): Response
    {
        $data = $this->homeService->getContactPageData();

        return Inertia::render('Home/Contact', $data);
    }

    /**
     * Submit contact consultation request.
     * @param SubmitContactRequest $request
     */
    public function submitContact(SubmitContactRequest $request): RedirectResponse
    {
        $this->contactRequestService->submitContact($request->validated());

        return back()->with('success', 'Yêu cầu tư vấn của bạn đã được gửi thành công. Đội ngũ SAM Digital sẽ liên hệ lại trong thời gian sớm nhất!');
    }
}
