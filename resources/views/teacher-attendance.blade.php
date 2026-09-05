@if ($part === 'header')
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Báo cáo chấm công theo ca học</title>
    <style>
        table { border-collapse: collapse; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #CBD5E1; padding: 8px; }
        th { background-color: #E2E8F0; }
        td { mso-number-format: "\@"; }
    </style>
</head>
<body>
<table>
    <tr><th colspan="7">BÁO CÁO CHẤM CÔNG THEO CA HỌC</th></tr>
    <tr><td colspan="7">Trung tâm: {{ $teacher?->report_center_name ?? $centerLabel ?? 'Không có dữ liệu' }}</td></tr>
    <tr><td colspan="7">Kỳ chấm công: Tháng {{ sprintf('%02d/%d', $month, $year) }}</td></tr>
    @if ($teacher !== null)
        <tr><td colspan="7">Giáo viên: {{ $teacher->full_name }} ({{ $teacher->teacher_code }})</td></tr>
    @endif
    <tr>
        <th>STT</th><th>Tên giáo viên</th><th>Ngày dạy</th><th>Khung giờ</th><th>Tên lớp và mã lớp</th><th>Môn học</th><th>Trạng thái ca</th>
    </tr>
@elseif ($part === 'row')
@php
    $colors = [
        \App\Enums\Constant::SESSION_STATUS_COMPLETED => ['#D1FAE5', '#065F46'],
        \App\Enums\Constant::SESSION_STATUS_IN_PROGRESS => ['#F3E8FF', '#6B21A8'],
        \App\Enums\Constant::SESSION_STATUS_CANCELLED => ['#FEE2E2', '#991B1B'],
        \App\Enums\Constant::SESSION_STATUS_UNATTENDED => ['#FFEDD5', '#9A3412'],
    ];
@endphp
            @php
                $color = $colors[$session->status];
            @endphp
            <tr>
                <td>{{ $index }}</td>
                <td>{{ $teacher->full_name }}</td>
                <td>{{ $session->session_date->format('d/m/Y') }}</td>
                <td>{{ substr($session->start_time, 0, 5) }} - {{ substr($session->end_time, 0, 5) }}</td>
                <td>{{ $session->report_class_name ?? 'N/A' }} ({{ $session->report_class_code ?? 'N/A' }})</td>
                <td>{{ $session->report_subject_name ?? 'N/A' }}</td>
                <td style="background-color: {{ $color[0] }}; color: {{ $color[1] }}; font-weight: bold;">{{ \App\Enums\Constant::SESSION_STATUS_LABELS[$session->status] }}</td>
            </tr>
@else
    @if ($index === 0)
        <tr><td colspan="7">Không có ca học phù hợp trong tháng.</td></tr>
    @endif
    <tr><th colspan="7">TỔNG CỘNG (CA ĐÃ HOÀN THÀNH): {{ $completed }} ca</th></tr>
</table>
</body>
</html>
@endif
