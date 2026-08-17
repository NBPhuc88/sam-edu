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
            'name'      => ['sometimes', 'required', 'string', 'max:255'],
            'code'      => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('subjects', 'code')
                    ->where(function ($query) {
                        return $query->where('center_id', $this->input('center_id'));
                    })
                    ->ignore($subjectId),
            ],
            'description'      => ['nullable', 'string'],
            'total_sessions'   => ['nullable', 'integer', 'min:1'],
            'duration_minutes' => ['nullable', 'integer', 'min:15'],
            'tuition_fee'      => ['nullable', 'numeric', 'min:0'],
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
            'code.required'      => 'Vui lòng nhập mã môn học.',
            'code.unique'        => 'Mã môn học đã tồn tại trong trung tâm này.',
            'tuition_fee.min'    => 'Học phí không thể âm.',
        ];
    }
}
