<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'class_id'                => ['required', 'integer', 'exists:classes,id'],
            'subject_id'              => ['required', 'integer', 'exists:subjects,id'],
            'teacher_id'              => ['required', 'integer', 'exists:teachers,id'],
            'room_id'                 => ['nullable', 'integer', 'exists:rooms,id'],
            'start_date'              => ['required', 'date'],
            'end_date'                => ['nullable', 'date', 'after_or_equal:start_date'],
            'weeks'                   => ['required', 'array'],
            'off_days'                => ['nullable', 'array'],
            'off_days.*.date'         => ['required_with:off_days', 'date'],
            'off_days.*.start_time'   => ['nullable', 'string'],
            'off_days.*.end_time'     => ['nullable', 'string'],
            'extra_days'              => ['nullable', 'array'],
            'extra_days.*.date'       => ['required_with:extra_days', 'date'],
            'extra_days.*.start_time' => ['required_with:extra_days', 'string'],
            'extra_days.*.end_time'   => ['required_with:extra_days', 'string'],
            'status'                  => ['nullable', 'string', 'in:active,inactive'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'class_id.required'       => 'Vui lòng chọn lớp học.',
            'subject_id.required'     => 'Vui lòng chọn môn học.',
            'teacher_id.required'     => 'Vui lòng chọn giáo viên giảng dạy.',
            'start_date.required'     => 'Vui lòng chọn ngày bắt đầu môn học.',
            'end_date.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'weeks.required'          => 'Vui lòng thiết lập ít nhất 1 khung giờ học trong tuần.',
        ];
    }
}
