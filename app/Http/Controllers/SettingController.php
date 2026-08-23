<?php

namespace App\Http\Controllers;

use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Services\Setting\SettingServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SettingController extends Controller
{
    public function __construct(
        protected SettingServiceInterface $settingService
    ) {
    }

    public function index(): InertiaResponse
    {
        $data = $this->settingService->getSettingsData();

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $data['settings'],
            'seo'      => $data['seo'],
        ]);
    }

    public function update(UpdateSettingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->settingService->updateSettings(
            $validated['settings'] ?? [],
            $validated['seo'] ?? []
        );

        return redirect()->route('settings.index')
            ->with('success', 'Cập nhật cài đặt hệ thống thành công!');
    }
}
