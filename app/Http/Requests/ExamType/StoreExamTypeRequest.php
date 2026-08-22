<?php

namespace App\Http\Requests\ExamType;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamTypeRequest extends FormRequest
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
        $isSuperAdmin = auth('admin')->user()?->isSuperAdmin() ?? false;

        return [
            'center_id'   => [$isSuperAdmin ? 'required' : 'nullable', 'integer', 'exists:centers,id'],
            'name'        => ['required', 'string', 'max:255'],
            'code'        => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'status'      => ['nullable', 'string', 'in:active,inactive'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'center_id'   => 'Trung tâm đào tạo',
            'name'        => 'Tên loại đề thi',
            'code'        => 'Mã loại đề thi',
            'description' => 'Mô tả',
            'status'      => 'Trạng thái',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required' => 'Vui lòng chọn Trung tâm áp dụng loại đề thi.',
            'center_id.exists'   => 'Trung tâm đã chọn không tồn tại.',
            'name.required'      => 'Vui lòng nhập tên loại đề thi.',
            'code.max'           => 'Mã loại đề thi không được vượt quá 50 ký tự.',
            'status.in'          => 'Trạng thái không hợp lệ.',
        ];
    }
}
