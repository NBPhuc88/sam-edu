<?php

namespace App\Repositories\Setting;

use App\Models\SystemSetting;
use Illuminate\Database\Eloquent\Collection;

class SystemSettingRepository implements SystemSettingRepositoryInterface
{
    /**
     * @return Collection<int, SystemSetting>
     */
    public function getAll(): Collection
    {
        return SystemSetting::all();
    }

    public function getByKey(string $key, ?string $default = null): ?string
    {
        return SystemSetting::getByKey($key, $default);
    }

    /**
     * @return array<string, string>
     */
    public function getAllAsKeyValue(): array
    {
        return SystemSetting::pluck('value', 'key')->toArray();
    }

    public function setByKey(string $key, string $value): SystemSetting
    {
        return SystemSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
