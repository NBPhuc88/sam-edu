<x-mail::message>
# 🎉 Chào mừng bạn đến với SAM Digital - Hệ thống Quản lý Trung Tâm Giáo Dục!

Kính gửi **{{ $fullName }}**,

Tài khoản **{{ $roleLabel }}** của bạn đã được khởi tạo thành công trên hệ thống. Dưới đây là thông tin đăng nhập chính thức của bạn:

<x-mail::table>
| Thông tin | Chi tiết |
| :--- | :--- |
| **Họ và tên** | **{{ $fullName }}** |
| **Vai trò** | **{{ $roleLabel }}** |
| **Tên đăng nhập** | **`{{ $username }}`** |
@if(!empty($rawPassword))
| **Mật khẩu khởi tạo** | **`{{ $rawPassword }}`** |
@endif
@if(!empty($centerName))
| **Trung tâm trực thuộc** | **{{ $centerName }}** |
@endif
</x-mail::table>

<x-mail::button :url="$loginUrl">
👉 Đăng Nhập Vào Hệ Thống Ngay
</x-mail::button>

<x-mail::panel>
🔒 **Lưu ý bảo mật quan trọng:**
- Vui lòng đổi mật khẩu mới ngay sau khi đăng nhập lần đầu tiên để đảm bảo an toàn tuyệt đối cho tài khoản.
- Tuyệt đối không chia sẻ thông tin đăng nhập này cho người khác.
</x-mail::panel>

Nếu bạn có bất kỳ thắc mắc hoặc cần hỗ trợ kỹ thuật, vui lòng liên hệ Ban quản trị qua hotline hoặc email hỗ trợ.

Trân trọng,<br>
**{{ config('app.name') }} Team**
</x-mail::message>
