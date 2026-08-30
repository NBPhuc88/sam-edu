<x-mail::message>
# 🔔 Thông báo: Trung tâm mới vừa đăng ký!

Hệ thống Quản lý Trung Tâm Giáo Dục **SAM Digital** vừa nhận được thông tin đăng ký trung tâm mới từ website:

<x-mail::table>
| Thông tin | Chi tiết |
| :--- | :--- |
| **Tên trung tâm** | **{{ $center->name }}** |
| **Số điện thoại** | {{ $center->phone ?? 'N/A' }} |
| **Email liên hệ** | {{ $center->email ?? 'N/A' }} |
| **Địa chỉ** | {{ $center->address ?? 'Chưa cập nhật' }} |
| **Gói dịch vụ** | **{{ $center->plan_name }}** |
| **Trạng thái** | {{ $center->status_label }} |
| **Thời gian đăng ký** | {{ $center->created_at ? $center->created_at->format('d-m-Y H:i:s') : now()->format('d-m-Y H:i:s') }} |
</x-mail::table>

Vui lòng truy cập trang Quản trị Admin để kiểm tra và liên hệ kích hoạt tài khoản cho trung tâm.

<x-mail::button :url="config('app.url') . '/admins'">
Truy cập Quản Trị Admin
</x-mail::button>

Trân trọng,<br>
**{{ config('app.name') }} System Notification**
</x-mail::message>
