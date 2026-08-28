<?php

namespace App\Console\Commands;

use App\Models\Permission;
use Illuminate\Console\Command;

class PermissionSyncCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permission:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Đồng bộ danh sách quyền từ file config/permissions.php vào cơ sở dữ liệu';

   /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Đang đồng bộ danh mục permissions từ config/permissions.php...');

        $modules = config('permissions.modules', []);

        if (empty($modules)) {
            $this->warn('Không tìm thấy cấu hình modules nào trong config/permissions.php');

            return self::FAILURE;
        }

        $totalSynced  = 0;
        $totalCreated = 0;
        $totalUpdated = 0;

        // Lưu danh sách permission code có trong config
        $permissionCodes = [];

        foreach ($modules as $mod) {
            $moduleKey   = $mod['key'];
            $moduleName  = $mod['name'];
            $moduleOrder = $mod['module_order'] ?? 0;

            foreach ($mod['actions'] as $act) {
                $code        = $act['code'];
                $name        = $act['name'];
                $action      = $act['action'] ?? 'index';
                $description = $act['description'] ?? null;

                // Thêm code vào danh sách permission hợp lệ
                $permissionCodes[] = $code;

                $permission = Permission::where('code', $code)->first();

                if (! $permission) {
                    Permission::create([
                        'code'         => $code,
                        'name'         => $name,
                        'module'       => $moduleName,
                        'module_key'   => $moduleKey,
                        'module_order' => $moduleOrder,
                        'action'       => $action,
                        'description'  => $description,
                        'is_system'    => true,
                    ]);

                    $totalCreated++;
                } else {
                    $permission->update([
                        'name'         => $name,
                        'module'       => $moduleName,
                        'module_key'   => $moduleKey,
                        'module_order' => $moduleOrder,
                        'action'       => $action,
                        'description'  => $description,
                    ]);

                    $totalUpdated++;
                }

                $totalSynced++;
            }
        }

        // Xóa permission có trong database nhưng không còn trong config
        $totalDeleted = Permission::whereNotIn('code', $permissionCodes)
            ->where('is_system', true)
            ->delete();

        $this->info(
            "Đồng bộ thành công! " .
            "Tổng số quyền: {$totalSynced} " .
            "(Tạo mới: {$totalCreated}, " .
            "Cập nhật: {$totalUpdated}, " .
            "Xóa: {$totalDeleted})"
        );

        return self::SUCCESS;
    }
}
