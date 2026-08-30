<x-mail::message>
# 🔔 Thông báo: Yêu cầu gia hạn gói dịch vụ từ Trung tâm!

Hệ thống vừa nhận được yêu cầu gia hạn gói dịch vụ từ **{{ $center->name }}** (Mã: {{ $center->code }}).

<x-mail::table>
| Thông tin | Chi tiết |
| :--- | :--- |
| **Tên Trung tâm** | **{{ $center->name }}** |
| **Mã Trung tâm** | {{ $center->code }} |
| **Email liên hệ** | {{ $center->email ?? 'N/A' }} |
| **Số điện thoại** | {{ $center->phone ?? 'N/A' }} |
| **Gói dịch vụ chọn gia hạn** | **{{ $plan->name }}** — {{ ($durationType ?? 'yearly') === 'yearly' ? '1 Năm' : '1 Tháng' }} ({{ number_format($amount ?? $plan->price, 0, ',', '.') }}đ) |
| **Gói hiện tại** | {{ $center->plan_name }} |
| **Ngày hết hạn hiện tại** | {{ $center->expires_at ? $center->expires_at->format('d/m/Y H:i') : 'Chưa có' }} |
| **Người gửi yêu cầu** | {{ $requestingUser?->full_name ?? 'Quản trị trung tâm' }} ({{ $requestingUser?->email ?? 'N/A' }}) |
| **Thời gian gửi yêu cầu** | {{ now()->format('d/m/Y H:i:s') }} |
@if(!empty($note))
| **Ghi chú thêm** | {{ $note }} |
@endif
</x-mail::table>

Vui lòng truy cập trang Quản trị Admin để kiểm tra và thực hiện gia hạn cho Trung tâm.

<x-mail::button :url="config('app.url') . '/centers/' . $center->id . '/edit'">
Thực Hiện Gia Hạn Trung Tâm
</x-mail::button>

Trân trọng,<br>
**{{ config('app.name') }} System Notification**
</x-mail::message>
