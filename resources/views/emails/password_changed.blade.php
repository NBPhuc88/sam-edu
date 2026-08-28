<x-mail::message>
# 🔐 Thông Báo: Mật Khẩu Vừa Được Thay Đổi

Kính gửi **{{ $fullName }}**,

Mật khẩu cho tài khoản **{{ $roleLabel }}** (`{{ $username }}`) của bạn trên hệ thống Quản lý Trung Tâm Giáo Dục **SAM Digital** đã được cập nhật thành công.

<x-mail::table>
| Thông tin | Chi tiết |
| :--- | :--- |
| **Tài khoản** | **`{{ $username }}`** ({{ $fullName }}) |
| **Vai trò** | **{{ $roleLabel }}** |
@if(!empty($centerName))
| **Trung tâm** | **{{ $centerName }}** |
@endif
@if(!empty($newPassword))
| **Mật khẩu mới** | **`{{ $newPassword }}`** |
@endif
| **Thời gian cập nhật** | **{{ $changedAt }}** |
| **Trạng thái** | ✅ Đã cập nhật mật khẩu |
</x-mail::table>

<x-mail::button :url="$loginUrl">
👉 Đăng Nhập Vào Hệ Thống Ngay
</x-mail::button>

<x-mail::panel>
🔒 **Lưu ý bảo mật quan trọng:**
- Để đảm bảo an toàn tuyệt đối cho tài khoản, quý khách vui lòng chủ động đăng nhập vào hệ thống và **thực hiện đổi lại mật khẩu cá nhân mới**.
- Tuyệt đối không chia sẻ thông tin đăng nhập hoặc mật khẩu này cho bất kỳ ai khác.
</x-mail::panel>

Trân trọng,<br>
**{{ config('app.name') }} Security Team**
</x-mail::message>
