<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class ImportCsvRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'], // Max 10MB
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Vui lòng chọn tệp CSV để tải lên.',
            'file.file' => 'Tệp tải lên không hợp lệ.',
            'file.mimes' => 'Định dạng tệp phải là .csv hoặc .txt',
            'file.max' => 'Dung lượng tệp vượt quá giới hạn cho phép (10MB).',
        ];
    }
}
