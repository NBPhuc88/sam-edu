<x-mail::message>
# 🔐 Cảnh Báo Bảo Mật: Mật Khẩu Vừa Được Thay Đổi

Kính gửi **{{ $fullName }}**,

Mật khẩu cho tài khoản **{{ $roleLabel }}** (`{{ $username }}`) của bạn trên SAM Digital - Hệ thống Quản lý Trung Tâm Giáo Dục đã được thay đổi thành công.

<x-mail::table>
| Thông tin | Chi tiết |
| :--- | :--- |
| **Tài khoản** | **`{{ $username }}`** ({{ $fullName }}) |
| **Vai trò** | **{{ $roleLabel }}** |
@if(!empty($centerName))
| **Trung tâm** | **{{ $centerName }}** |
@endif
| **Thời gian cập nhật** | **{{ $changedAt }}** |
| **Trạng thái** | ✅ Đã áp dụng mật khẩu mới |
</x-mail::table>

<x-mail::button :url="$loginUrl">
👉 Đăng Nhập Vào Hệ Thống
</x-mail::button>

<x-mail::panel>
⚠️ **Bạn không thực hiện thao tác này?**
Nếu bạn không yêu cầu hoặc không trực tiếp đổi mật khẩu, rất có thể tài khoản của bạn đã bị xâm nhập. Vui lòng **liên hệ ngay với Quản trị viên hệ thống** hoặc sử dụng chức năng Quên Mật Khẩu để khôi phục tài khoản khẩn cấp.
</x-mail::panel>

Trân trọng,<br>
**{{ config('app.name') }} Security Team**
</x-mail::message>
