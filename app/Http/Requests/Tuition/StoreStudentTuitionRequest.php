<?php

namespace App\Http\Requests\Tuition;

use Illuminate\Foundation\Http\FormRequest;

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
            'center_id'    => ['required', 'integer', 'exists:centers,id'],
            'student_id'   => ['required', 'integer', 'exists:students,id'],
            'class_id'     => ['required', 'integer', 'exists:classes,id'],
            'title'        => ['nullable', 'string', 'max:100'],
            'total_amount' => ['required', 'numeric', 'min:0', 'max:1000000000'],
            'due_date'     => ['nullable', 'date'],
            'note'         => ['nullable', 'string', 'max:1000'],
            // First installment (optional)
            'initial_payment_amount'   => ['nullable', 'numeric', 'min:0', 'max:1000000000', 'lte:total_amount'],
            'initial_payment_date'     => ['nullable', 'date'],
            'initial_payment_method'   => ['nullable', 'string', 'in:cash,bank_transfer,momo,zalopay,credit_card,other'],
            'initial_transaction_code' => ['nullable', 'string', 'max:100'],
            'initial_payment_note'     => ['nullable', 'string', 'max:255'],
        ];
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
            'initial_payment_amount.lte' => 'Số tiền đóng đợt 1 không được vượt quá tổng số tiền học phí cần đóng.',
            'title.max'                  => 'Tiêu đề khoản thu không được vượt quá 100 ký tự.',
        ];
    }
}
