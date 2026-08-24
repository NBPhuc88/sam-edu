<x-mail::message>
# 🔑 Mã Xác Thực OTP Cho {{ $actionLabel }}

Kính gửi **{{ $name }}**,

Bạn đang thực hiện yêu cầu **{{ $actionLabel }}** trên SAM Digital - Hệ thống Quản lý Trung Tâm Giáo Dục. Dưới đây là mã xác thực bảo mật 6 chữ số của bạn:

<x-mail::panel>
<div style="text-align: center; padding: 10px 0;">
    <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #059669; font-family: monospace; display: block;">
        {{ $otp }}
    </span>
</div>
</x-mail::panel>

⏱️ **Thời hạn hiệu lực:** Mã xác thực này **chỉ có hiệu lực trong {{ $expiresInMinutes }} phút** kể từ thời điểm gửi. Sau thời gian này, mã sẽ tự động bị hủy và bạn cần yêu cầu gửi lại mã mới.

🔒 **Lưu ý bảo mật quan trọng:**
- Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai (kể cả nhân viên hỗ trợ hệ thống).
- Nếu bạn không yêu cầu thực hiện thao tác **{{ $actionLabel }}**, vui lòng bỏ qua thư này và liên hệ ngay với Ban Quản trị để kiểm tra an toàn tài khoản.

Trân trọng,<br>
**{{ config('app.name') }} Security Team**
</x-mail::message>
