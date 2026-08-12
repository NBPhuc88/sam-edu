<x-mail::message>
# 🔑 Mã OTP Đặt Lại Mật Khẩu

Kính gửi **{{ $accountName }}**,

Hệ thống Quản lý Giáo dục **Sam Edu** nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 

Mã xác thực OTP của bạn là:

<x-mail::panel>
<div style="text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #059669;">
{{ $otp }}
</div>
</x-mail::panel>

⏱️ **Lưu ý:**
- Mã OTP này có hiệu lực trong vòng **15 phút**.
- Sau khi nhập mã OTP thành công, hệ thống sẽ đăng nhập và **bắt buộc bạn phải cập nhật mật khẩu mới ngay lập tức**.
- Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này và bảo mật tài khoản của mình.

Trân trọng,<br>
**{{ config('app.name') }} Security Team**
</x-mail::message>
