<?php

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;

class ExportAttendanceRequest extends FormRequest
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
            'month'     => ['required', 'integer', 'between:1,12'],
            'year'      => ['required', 'integer', 'between:2000,2100'],
            'center_id' => ['nullable', 'integer', 'exists:centers,id'],
        ];
    }
}
