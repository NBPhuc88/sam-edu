<?php

namespace App\Http\Requests\Session;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClassSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'session_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'start_time'   => ['sometimes', 'required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'end_time'     => ['sometimes', 'required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/', 'after:start_time'],
            'teacher_id'   => ['sometimes', 'required', 'integer', 'exists:teachers,id'],
            'room_id'      => ['nullable', 'integer', 'exists:rooms,id'],
            'status'       => ['sometimes', 'required', 'string', 'in:scheduled,in_progress,completed,cancelled'],
            'topic'        => ['nullable', 'string', 'max:255'],
            'note'         => ['nullable', 'string', 'max:1000'],
            'reason'       => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'session_date.required' => 'Vui lòng chọn ngày học.',
            'start_time.required'   => 'Vui lòng chọn giờ bắt đầu.',
            'end_time.required'     => 'Vui lòng chọn giờ kết thúc.',
            'end_time.after'        => 'Giờ kết thúc phải sau giờ bắt đầu.',
            'teacher_id.required'   => 'Vui lòng chọn giáo viên phụ trách.',
            'teacher_id.exists'     => 'Giáo viên được chọn không tồn tại.',
            'room_id.exists'        => 'Phòng học được chọn không tồn tại.',
            'status.required'       => 'Vui lòng chọn trạng thái buổi học.',
        ];
    }
}
