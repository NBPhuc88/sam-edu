<?php

namespace App\Repositories\Setting;

use App\Models\SystemSetting;
use Illuminate\Database\Eloquent\Collection;

interface SystemSettingRepositoryInterface
{
    /**
     * @return Collection<int, SystemSetting>
     */
    public function getAll(): Collection;

    public function getByKey(string $key, ?string $default = null): ?string;

    /**
     * @return array<string, string>
     */
    public function getAllAsKeyValue(): array;

    public function setByKey(string $key, string $value): SystemSetting;
}
