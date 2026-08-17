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
            'class_id'                       => ['required', 'integer', 'exists:classes,id'],
            'subject_id'                     => ['required', 'integer', 'exists:subjects,id'],
            'teacher_id'                     => ['required', 'integer', 'exists:teachers,id'],
            'room_id'                        => ['nullable', 'integer', 'exists:rooms,id'],
            'start_date'                     => ['required', 'date'],
            'end_date'                       => ['nullable', 'date', 'after_or_equal:start_date'],
            'weekly_schedules'               => ['nullable', 'array'],
            'weekly_schedules.*.weekday'     => ['required_with:weekly_schedules', 'integer', 'between:1,7'],
            'weekly_schedules.*.start_time'  => ['required_with:weekly_schedules', 'string'],
            'weekly_schedules.*.end_time'    => ['required_with:weekly_schedules', 'string', 'after:weekly_schedules.*.start_time'],
            'specific_sessions'              => ['nullable', 'array'],
            'specific_sessions.*.date'       => ['required_with:specific_sessions', 'date'],
            'specific_sessions.*.start_time' => ['required_with:specific_sessions', 'string'],
            'specific_sessions.*.end_time'   => ['required_with:specific_sessions', 'string'],
            'specific_sessions.*.topic'      => ['nullable', 'string', 'max:500'],
            'off_sessions'                   => ['nullable', 'array'],
            'off_sessions.*.date'            => ['required_with:off_sessions', 'date'],
            'off_sessions.*.reason'          => ['nullable', 'string', 'max:500'],
            'exclude_vietnam_holidays'       => ['nullable', 'boolean'],
            'status'                         => ['nullable', 'string', 'in:active,inactive'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'class_id.required'                 => 'Vui lòng chọn lớp học.',
            'subject_id.required'               => 'Vui lòng chọn môn học.',
            'teacher_id.required'               => 'Vui lòng chọn giáo viên giảng dạy.',
            'start_date.required'               => 'Vui lòng chọn ngày bắt đầu môn học.',
            'end_date.after_or_equal'           => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'weekly_schedules.*.end_time.after' => 'Giờ kết thúc phải sau giờ bắt đầu.',
        ];
    }
}
