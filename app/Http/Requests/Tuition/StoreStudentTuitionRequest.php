<?php

namespace App\Http\Requests\Tuition;

use App\Enums\Constant;
use App\Models\SchoolClass;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreStudentTuitionRequest extends FormRequest
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
            'center_id'      => ['required', 'integer', 'exists:centers,id'],
            'student_id'     => ['required', 'integer', 'exists:students,id'],
            'class_id'       => ['required', 'integer', 'exists:classes,id'],
            'title'          => ['nullable', 'string', 'max:100'],
            'total_amount'   => ['required', 'numeric', 'min:0', 'max:1000000000'],
            'discount_type'  => ['nullable', 'integer', Rule::in(Constant::DISCOUNT_TYPES)],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'due_date'       => ['nullable', 'date'],
            'note'           => ['nullable', 'string', 'max:1000'],
            // First installment (optional)
            'initial_payment_amount'   => ['nullable', 'numeric', 'min:0', 'max:1000000000', 'lte:total_amount'],
            'initial_payment_date'     => ['nullable', 'date'],
            'initial_payment_method'   => ['nullable', 'integer', Rule::in(Constant::PAYMENT_METHODS)],
            'initial_transaction_code' => ['nullable', 'string', 'max:100'],
            'initial_payment_note'     => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @param Validator $validator
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $discountType  = $this->input('discount_type') ? (int) $this->input('discount_type') : null;
            $discountValue = $this->input('discount_value') !== null && $this->input('discount_value') !== '' ? (float) $this->input('discount_value') : 0;
            $classId       = $this->input('class_id') ? (int) $this->input('class_id') : null;

            if ($discountType === Constant::DISCOUNT_TYPE_PERCENTAGE && $discountValue > 100) {
                $validator->errors()->add(
                    'discount_value',
                    "Mức giảm giá phần trăm ({$discountValue}%) không được vượt quá 100%."
                );
            }

            if ($discountType === Constant::DISCOUNT_TYPE_DIRECT && $classId) {
                $schoolClass  = SchoolClass::find($classId);
                $classTuition = $schoolClass ? (float) $schoolClass->total_tuition_fee : 0;

                if ($classTuition > 0 && $discountValue > $classTuition) {
                    $validator->errors()->add(
                        'discount_value',
                        'Mức giảm giá trực tiếp (' . number_format($discountValue, 0, ',', '.') . 'đ) không được vượt quá tổng học phí của lớp (' . number_format($classTuition, 0, ',', '.') . 'đ).'
                    );
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
            'center_id.required'         => 'Vui lòng chọn Trung tâm đào tạo.',
            'center_id.exists'           => 'Trung tâm đã chọn không tồn tại.',
            'student_id.required'        => 'Vui lòng chọn học sinh.',
            'student_id.exists'          => 'Học sinh đã chọn không tồn tại.',
            'class_id.required'          => 'Vui lòng chọn lớp học.',
            'class_id.exists'            => 'Lớp học đã chọn không tồn tại.',
            'total_amount.required'      => 'Vui lòng nhập tổng số tiền học phí cần đóng.',
            'total_amount.min'           => 'Số tiền học phí không thể âm.',
            'total_amount.max'           => 'Số tiền học phí không được vượt quá 1.000.000.000 VNĐ.',
            'discount_value.min'         => 'Mức giảm giá không được nhỏ hơn 0.',
            'initial_payment_amount.lte' => 'Số tiền đóng đợt 1 không được vượt quá tổng số tiền học phí cần đóng.',
            'title.max'                  => 'Tiêu đề khoản thu không được vượt quá 100 ký tự.',
        ];
    }
}
