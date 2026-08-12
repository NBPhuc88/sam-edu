<x-mail::message>
# 🔔 Thông báo cập nhật tài khoản Trung tâm

Kính gửi Ban Quản lý **{{ $center->name }}**,

Hệ thống Quản lý Giáo dục **Sam Edu** xin thông báo: Thông tin tài khoản quản trị của Trung tâm đã được cập nhật thành công từ phía Quản trị viên hệ thống.

<x-mail::table>
| Thông tin tài khoản | Chi tiết mới nhất |
| :--- | :--- |
| **Mã trung tâm** | `{{ $center->code }}` |
| **Tên trung tâm** | **{{ $center->name }}** |
| **Tên đăng nhập** | `{{ $center->username ?? $center->code }}` |
| **Email nhận thông báo** | {{ $center->email ?? 'Chưa cập nhật' }} |
| **Số điện thoại** | {{ $center->phone ?? 'Chưa cập nhật' }} |
| **Trạng thái tài khoản** | {{ $center->status === 'active' ? 'Đang hoạt động' : ($center->status === 'expired' ? 'Đã hết hạn' : $center->status) }} |
| **Gói dịch vụ** | **{{ strtoupper($center->subscription_plan ?? 'N/A') }}** |
| **Thời gian cập nhật** | {{ now()->format('H:i:s d/m/Y') }} |
</x-mail::table>

@if ($isPasswordUpdated)
<x-mail::panel>
### 🔑 Thông tin Mật khẩu Mới:
- **Mật khẩu mới của bạn là:** `{{ $newPassword }}`

*Vì lý do bảo mật, vui lòng đăng nhập và chủ động bảo vệ mật khẩu truy cập của Trung tâm. Không chia sẻ thông tin này cho người không có thẩm quyền.*
</x-mail::panel>
@else
<x-mail::panel>
ℹ️ **Mật khẩu:** Mật khẩu đăng nhập của trung tâm được giữ nguyên (không thay đổi).
</x-mail::panel>
@endif

Quý Trung tâm có thể truy cập hệ thống để kiểm tra và quản lý dịch vụ:

<x-mail::button :url="config('app.url') . '/login'">
Đăng Nhập Vào Hệ Thống
</x-mail::button>

Nếu không yêu cầu thay đổi thông tin này, vui lòng liên hệ ngay với Quản trị viên hệ thống Sam Edu để được trợ giúp.

Trân trọng,<br>
**{{ config('app.name') }} System Support**
</x-mail::message>
