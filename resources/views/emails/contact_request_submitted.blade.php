<x-mail::message>
# 📬 Thông báo: Có yêu cầu tư vấn mới từ khách hàng!

Hệ thống Quản lý Giáo dục **{{ config('app.name') }}** vừa nhận được yêu cầu liên hệ / tư vấn mới từ website:

<x-mail::table>
| Thông tin | Chi tiết |
| :--- | :--- |
| **Họ và tên** | **{{ $contact->full_name }}** |
| **Số điện thoại** | **{{ $contact->phone }}** |
| **Email** | {{ $contact->email ?? 'Chưa cung cấp' }} |
| **Tên trung tâm/Tổ chức** | {{ $contact->center_name ?? 'Chưa cung cấp' }} |
| **Thời gian gửi** | {{ $contact->created_at ? $contact->created_at->format('d-m-Y H:i:s') : now()->format('d-m-Y H:i:s') }} |
</x-mail::table>

@if(!empty($contact->message))
**Nội dung lời nhắn / Yêu cầu:**
> {{ $contact->message }}
@endif

Vui lòng nhanh chóng liên hệ với khách hàng để tư vấn và hỗ trợ mở trung tâm.

<x-mail::button :url="config('app.url')">
Truy cập Trang Quản Trị
</x-mail::button>

Trân trọng,<br>
**{{ config('app.name') }} Notification System**
</x-mail::message>
