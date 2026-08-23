<x-mail::message>
# 📝 Thông Báo Kỳ Thi Trực Tuyến

@if($recipientRole === 'teacher')
Kính gửi Thầy/Cô **{{ $recipientName }}**,

Lớp học **{{ $classExam->schoolClass?->name }}** vừa có một kỳ thi mới được lên lịch. Dưới đây là thông tin chi tiết của kỳ thi:
@else
Chào bạn **{{ $recipientName }}**,

Lớp học **{{ $classExam->schoolClass?->name }}** của bạn vừa có một bài thi mới. Dưới đây là thông tin và mã vào phòng thi của bạn:
@endif

<x-mail::panel>
<div style="text-align: center; margin: 10px 0;">
    <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; color: #4b5563; letter-spacing: 1px;">
        🔑 MÃ TRUY CẬP PHÒNG THI (ACCESS CODE)
    </div>
    <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #059669; margin: 8px 0;">
        {{ $classExam->access_code }}
    </div>
    <div style="font-size: 12px; color: #6b7280;">
        Mã Kỳ Thi: <strong>{{ $classExam->code ?? ('CE' . $classExam->id) }}</strong>
    </div>
</div>
</x-mail::panel>

<x-mail::table>
| Thông tin kỳ thi | Chi tiết |
| :--- | :--- |
| **Tên kỳ thi** | **{{ $classExam->title }}** |
| **Lớp học** | **{{ $classExam->schoolClass?->name }}** |
| **Môn học** | {{ $classExam->exam?->subject?->name ?? 'Tổng hợp' }} |
| **Ngày thi** | {{ $classExam->exam_date ? (is_string($classExam->exam_date) ? $classExam->exam_date : $classExam->exam_date->format('d/m/Y')) : 'Theo thông báo' }} |
| **Khung giờ mở phòng** | {{ $classExam->start_time ? substr((string)$classExam->start_time, 0, 5) : '00:00' }} - {{ $classExam->end_time ? substr((string)$classExam->end_time, 0, 5) : '23:59' }} |
| **Thời lượng làm bài** | **{{ $classExam->duration_minutes }} phút** |
| **Điểm tối đa** | {{ $classExam->max_score }} điểm (Điểm đạt: {{ $classExam->pass_score ?? 5 }} điểm) |
</x-mail::table>

<x-mail::button :url="$examRoomUrl">
👉 VÀO PHÒNG THI NGAY
</x-mail::button>

### 📌 Hướng dẫn tham gia phòng thi:
1. **Cách 1**: Nhấp trực tiếp vào nút **"VÀO PHÒNG THI NGAY"** ở trên.
2. **Cách 2**: Truy cập vào đường dẫn [{{ $enterCodeUrl }}]({{ $enterCodeUrl }}) và nhập mã truy cập: **`{{ $classExam->access_code }}`**.

⏱️ **Lưu ý quan trọng cho thí sinh:**
- Vui lòng đăng nhập đúng tài khoản học sinh của bạn trước khi vào thi.
- Có mặt tại phòng thi trước giờ bắt đầu ít nhất **5-10 phút** để kiểm tra thiết bị, kết nối mạng và tai nghe/microphone nếu có phần thi Nghe/Nói.
- Hệ thống sẽ tự động nộp bài khi hết thời gian làm bài.

Chúc bạn hoàn thành bài thi thật tốt và đạt kết quả cao!

Trân trọng,<br>
**{{ config('app.name') }} Examination System**
</x-mail::message>
