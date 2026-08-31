<?php

namespace App\Http\Requests\Tuition;

use App\Enums\Constant;
use App\Models\SchoolClass;
use App\Models\StudentTuition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateStudentTuitionRequest extends FormRequest
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
            'center_id'      => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'student_id'     => ['sometimes', 'required', 'integer', 'exists:students,id'],
            'class_id'       => ['sometimes', 'required', 'integer', 'exists:classes,id'],
            'title'          => ['nullable', 'string', 'max:255'],
            'total_amount'   => ['sometimes', 'required', 'numeric', 'min:0'],
            'discount_type'  => ['nullable', 'integer', Rule::in(Constant::DISCOUNT_TYPES)],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'due_date'       => ['nullable', 'date'],
            'note'           => ['nullable', 'string'],
        ];
    }

    /**
     * @param Validator $validator
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $discountType  = $this->has('discount_type') ? ($this->input('discount_type') ? (int) $this->input('discount_type') : null) : null;
            $discountValue = $this->has('discount_value') && $this->input('discount_value') !== '' ? (float) $this->input('discount_value') : 0;

            if ($discountType === Constant::DISCOUNT_TYPE_PERCENTAGE && $discountValue > 100) {
                $validator->errors()->add(
                    'discount_value',
                    "Mức giảm giá phần trăm ({$discountValue}%) không được vượt quá 100%."
                );
            }

            if ($discountType === Constant::DISCOUNT_TYPE_DIRECT) {
                $tuitionId = (int) $this->route('id');
                $tuition   = StudentTuition::find($tuitionId);
                $classId   = $this->input('class_id') ? (int) $this->input('class_id') : ($tuition ? (int) $tuition->class_id : null);

                if ($classId) {
                    $schoolClass  = SchoolClass::find($classId);
                    $classTuition = $schoolClass ? (float) $schoolClass->total_tuition_fee : 0;

                    if ($classTuition > 0 && $discountValue > $classTuition) {
                        $validator->errors()->add(
                            'discount_value',
                            'Mức giảm giá trực tiếp (' . number_format($discountValue, 0, ',', '.') . 'đ) không được vượt quá tổng học phí của lớp (' . number_format($classTuition, 0, ',', '.') . 'đ).'
                        );
                    }
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required'    => 'Vui lòng chọn Trung tâm đào tạo.',
            'student_id.required'   => 'Vui lòng chọn học sinh.',
            'class_id.required'     => 'Vui lòng chọn lớp học.',
            'total_amount.required' => 'Vui lòng nhập tổng số tiền học phí cần đóng.',
            'total_amount.min'      => 'Số tiền học phí không thể âm.',
            'discount_value.min'    => 'Mức giảm giá không được nhỏ hơn 0.',
        ];
    }
}
