<?php

namespace App\Http\Requests\Subject;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
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
        $subjectId = $this->route('id');

        return [
            'center_id' => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'name'      => ['sometimes', 'required', 'string', 'max:100'],
            'code'      => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('subjects', 'code')
                    ->where(function ($query) {
                        return $query->where('center_id', $this->input('center_id'));
                    })
                    ->ignore($subjectId),
            ],
            'description'      => ['nullable', 'string', 'max:1000'],
            'total_sessions'   => ['nullable', 'integer', 'min:1', 'max:365'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
            'tuition_fee'      => ['nullable', 'numeric', 'min:0', 'max:1000000000'],
            'status'           => ['sometimes', 'required', 'string', 'in:active,inactive'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required' => 'Vui lòng chọn Trung tâm đào tạo.',
            'name.required'      => 'Vui lòng nhập tên môn học.',
            'name.max'           => 'Tên môn học không được vượt quá 100 ký tự.',
            'code.max'           => 'Mã môn học không được vượt quá 20 ký tự.',
            'code.regex'         => 'Mã môn học chỉ được chứa ký tự chữ số và gạch ngang.',
            'code.unique'        => 'Mã môn học đã tồn tại trong trung tâm này.',
            'tuition_fee.min'    => 'Học phí không thể âm.',
            'tuition_fee.max'    => 'Học phí không được vượt quá 1.000.000.000 VNĐ.',
        ];
    }
}
