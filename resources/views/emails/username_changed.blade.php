<x-mail::message>
# 👤 Thông Báo: Thay Đổi Tên Đăng Nhập (Username)

Kính gửi **{{ $fullName }}**,

Tên đăng nhập cho tài khoản **{{ $roleLabel }}** của bạn trên SAM Digital - Hệ thống Quản lý Trung Tâm Giáo Dục đã được cập nhật thành công:

<x-mail::table>
| Thông tin | Chi tiết |
| :--- | :--- |
| **Họ và tên** | **{{ $fullName }}** |
| **Vai trò** | **{{ $roleLabel }}** |
| **Tên đăng nhập cũ** | `{{ $oldUsername }}` |
| **Tên đăng nhập MỚI** | **`{{ $newUsername }}`** |
@if(!empty($centerName))
| **Trung tâm** | **{{ $centerName }}** |
@endif
| **Thời gian thay đổi** | **{{ $changedAt }}** |
</x-mail::table>

Từ thời điểm này, vui lòng sử dụng tên đăng nhập mới **`{{ $newUsername }}`** cùng mật khẩu hiện tại để đăng nhập vào hệ thống.

<x-mail::button :url="$loginUrl">
👉 Đăng Nhập Bằng Username Mới
</x-mail::button>

<x-mail::panel>
⚠️ **Bạn không yêu cầu thay đổi tên đăng nhập?**
Nếu bạn không thực hiện hoặc không biết về thay đổi này, vui lòng **liên hệ ngay với Quản trị viên hệ thống** để được hỗ trợ bảo mật tài khoản.
</x-mail::panel>

Trân trọng,<br>
**{{ config('app.name') }} Team**
</x-mail::message>
