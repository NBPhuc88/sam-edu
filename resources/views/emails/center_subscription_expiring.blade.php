<x-mail::message>
# ⏰ Thông báo: Gói dịch vụ sắp hết hạn (Còn {{ $daysRemaining }} ngày)

Kính gửi Ban Quản lý **{{ $center->name }}**,

Hệ thống Quản lý Trung Tâm Giáo Dục **SAM Digital** xin thông báo: Gói dịch vụ của quý Trung tâm sẽ hết hạn vào ngày **{{ $center->expires_at ? $center->expires_at->format('d/m/Y') : ($center->trial_ends_at ? $center->trial_ends_at->format('d/m/Y') : 'N/A') }}** (còn **{{ $daysRemaining }} ngày**).

Để tránh làm gián đoạn các hoạt động vận hành, điểm danh, sắp xếp lịch học và khảo thí của trung tâm, quý khách vui lòng liên hệ với Quản trị viên hệ thống để thực hiện gia hạn gói dịch vụ.

<x-mail::table>
| Thông tin Trung tâm | Chi tiết |
| :--- | :--- |
| **Mã trung tâm** | `{{ $center->code }}` |
| **Tên trung tâm** | **{{ $center->name }}** |
| **Gói dịch vụ hiện tại** | **{{ strtoupper($center->subscription_plan ?? 'N/A') }}** |
| **Ngày hết hạn** | **{{ $center->expires_at ? $center->expires_at->format('d/m/Y H:i') : ($center->trial_ends_at ? $center->trial_ends_at->format('d/m/Y H:i') : 'N/A') }}** |
| **Email liên hệ** | {{ $center->email ?? 'Chưa cập nhật' }} |
| **Số điện thoại** | {{ $center->phone ?? 'Chưa cập nhật' }} |
</x-mail::table>

Vui lòng liên hệ với bộ phận hỗ trợ SAM Digital hoặc Quản trị viên hệ thống để hoàn tất gia hạn trước khi thời gian sử dụng kết thúc.

Trân trọng,<br>
**{{ config('app.name') }} System Support**
</x-mail::message>
