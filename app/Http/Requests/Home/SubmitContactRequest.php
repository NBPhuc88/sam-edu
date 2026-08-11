<?php

namespace App\Http\Requests\Home;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SubmitContactRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name'   => 'required|string|max:255',
            'phone'       => 'required|string|max:30',
            'email'       => 'nullable|email|max:255',
            'center_name' => 'nullable|string|max:255',
            'message'     => 'nullable|string|max:2000',
        ];
    }
}
