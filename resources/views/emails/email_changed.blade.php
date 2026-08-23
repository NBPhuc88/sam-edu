<x-mail::message>
# 📧 Thông Báo: Cập Nhật Địa Chỉ Email Thành Công

Kính gửi **{{ $fullName }}**,

Địa chỉ email liên kết với tài khoản **{{ $roleLabel }}** (`{{ $username }}`) của bạn trên Hệ thống Quản lý Giáo dục Sam Edu đã được cập nhật thành công.

<x-mail::table>
| Thông tin | Chi tiết |
| :--- | :--- |
| **Tài khoản** | **`{{ $username }}`** ({{ $fullName }}) |
| **Vai trò** | **{{ $roleLabel }}** |
@if(!empty($oldEmail))
| **Email trước đây** | `{{ $oldEmail }}` |
@endif
| **Email mới** | **`{{ $newEmail }}`** |
@if(!empty($centerName))
| **Trung tâm** | **{{ $centerName }}** |
@endif
| **Thời gian cập nhật** | **{{ $changedAt }}** |
</x-mail::table>

Mọi thông báo, mã xác thực và thông tin học tập/giảng dạy tiếp theo sẽ được gửi về địa chỉ email mới này.

<x-mail::button :url="$loginUrl">
👉 Đăng Nhập Vào Hệ Thống
</x-mail::button>

<x-mail::panel>
⚠️ **Bạn không thực hiện thay đổi này?**
Nếu bạn không yêu cầu cập nhật email này, vui lòng **liên hệ ngay với Ban Quản trị trung tâm** để bảo vệ tài khoản của bạn.
</x-mail::panel>

Trân trọng,<br>
**{{ config('app.name') }} Security Team**
</x-mail::message>
