<x-mail::message>
# 🔔 {{ $actionType === 'change' ? 'Thông báo: Thay Đổi Gói Cước Dịch Vụ SaaS Thành Công' : 'Thông báo: Gia Hạn Gói Cước Dịch Vụ SaaS Thành Công' }}

Kính gửi Ban Quản lý **{{ $center->name }}**,

Hệ thống Quản lý Giáo Dục **SAM Digital** xin thông báo: Gói cước dịch vụ SaaS của Trung tâm đã được **{{ $actionType === 'change' ? 'THAY ĐỔI' : 'GIA HẠN' }}** thành công.

<x-mail::table>
| Thông tin chi tiết | Thông số gói cước mới |
| :--- | :--- |
| **Trung tâm** | **{{ $center->name }}** |
| **Gói dịch vụ** | **{{ $subscription->plan_name }}** (`{{ $subscription->plan_code }}`) |
| **Hành động** | **{{ $actionType === 'change' ? 'Đổi Gói Cước Mới' : 'Gia Hạn Gói Cước' }}** |
| **Giá thanh toán** | **{{ number_format($subscription->price, 0, ',', '.') }} VNĐ** |
| **Thời hạn đăng ký** | **{{ $subscription->duration_days }} ngày** |
| **Ngày bắt đầu** | **{{ \Illuminate\Support\Carbon::parse($subscription->starts_at)->format('d/m/Y') }}** |
| **Ngày kết thúc** | **{{ \Illuminate\Support\Carbon::parse($subscription->ends_at)->format('d/m/Y') }}** |
| **Giới hạn Học sinh** | **{{ $center->max_students ? $center->max_students . ' học sinh' : 'Không giới hạn' }}** |
| **Giới hạn Lớp học** | **{{ $center->max_classes ? $center->max_classes . ' lớp' : 'Không giới hạn' }}** |
| **Trạng thái hệ thống** | **{{ $center->status === 'active' ? 'Đang hoạt động' : 'Đã cập nhật' }}** |
</x-mail::table>

Cảm ơn Quản lý Trung tâm đã đồng hành cùng **SAM Digital**. Nếu có thắc mắc hoặc cần hỗ trợ thêm, vui lòng liên hệ Bộ phận Chăm sóc Khách hàng của chúng tôi.

Trân trọng,<br>
**{{ config('app.name') }} Support Team**
</x-mail::message>
