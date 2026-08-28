<?php

namespace App\Http\Requests\Class;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassStudentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'integer', Rule::in(Constant::CLASS_STUDENT_STATUSES)],
            'note'   => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'Vui lòng chọn trạng thái học sinh trong lớp.',
            'status.in'       => 'Trạng thái học sinh trong lớp không hợp lệ.',
            'note.max'        => 'Ghi chú không được vượt quá 500 ký tự.',
        ];
    }
}
