<x-mail::message>
# 🔔 Thông báo cập nhật thông tin Trung tâm

Kính gửi Ban Quản lý **{{ $center->name }}**,

Hệ thống Quản lý Giáo dục **Sam Edu** xin thông báo: Thông tin của Trung tâm đã được cập nhật thành công từ phía Quản trị viên hệ thống.

<x-mail::table>
| Thông tin Trung tâm | Chi tiết mới nhất |
| :--- | :--- |
| **Mã trung tâm** | `{{ $center->code }}` |
| **Tên trung tâm** | **{{ $center->name }}** |
| **Email nhận thông báo** | {{ $center->email ?? 'Chưa cập nhật' }} |
| **Số điện thoại** | {{ $center->phone ?? 'Chưa cập nhật' }} |
| **Địa chỉ** | {{ $center->address ?? 'Chưa cập nhật' }} |
| **Trạng thái** | {{ $center->status === 'active' ? 'Đang hoạt động' : ($center->status === 'expired' ? 'Đã hết hạn' : $center->status) }} |
| **Gói dịch vụ** | **{{ strtoupper($center->subscription_plan ?? 'N/A') }}** |
| **Thời gian cập nhật** | {{ now()->format('H:i:s d/m/Y') }} |
</x-mail::table>

Nếu có thắc mắc hoặc cần hỗ trợ về thông tin này, vui lòng liên hệ ngay với Quản trị viên hệ thống Sam Edu.

Trân trọng,<br>
**{{ config('app.name') }} System Support**
</x-mail::message>
