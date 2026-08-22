<?php

namespace App\Http\Requests\Holiday;

use Illuminate\Foundation\Http\FormRequest;

class StoreHolidayRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth('admin')->check() && auth('admin')->user()->isSuperAdmin();
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('date') && is_string($this->date)) {
            $rawDate = trim($this->date);

            // Chuẩn hóa nếu ngày được gửi lên dưới dạng d-m-Y hoặc d/m/Y
            if (preg_match('/^(\d{1,2})[-|\/](\d{1,2})[-|\/](\d{4})$/', $rawDate, $matches)) {
                $d = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
                $m = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
                $y = $matches[3];
                $this->merge([
                    'date' => "{$y}-{$m}-{$d}",
                ]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'date'         => ['required', 'date_format:Y-m-d'],
            'is_lunar'     => ['nullable', 'boolean'],
            'is_recurring' => ['nullable', 'boolean'],
            'description'  => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required'    => 'Tên ngày lễ không được để trống.',
            'date.required'    => 'Ngày lễ không được để trống.',
            'date.date_format' => 'Ngày lễ phải có định dạng YYYY-MM-DD.',
        ];
    }
}
