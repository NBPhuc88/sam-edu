<?php

namespace App\Http\Requests\Session;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterClassSessionRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search'       => ['nullable', 'string', 'max:255'],
            'center_id'    => ['nullable', 'integer'],
            'class_id'     => ['nullable', 'integer'],
            'subject_id'   => ['nullable', 'integer'],
            'teacher_id'   => ['nullable', 'integer'],
            'room_id'      => ['nullable', 'integer'],
            'session_date' => ['nullable', 'date_format:Y-m-d'],
            'date_from'    => ['nullable', 'date_format:Y-m-d'],
            'date_to'      => ['nullable', 'date_format:Y-m-d'],
            'date_scope'   => ['nullable', 'string', 'in:all,from_today'],
            'status'       => ['nullable', 'integer', Rule::in(Constant::SESSION_STATUSES)],
            'page'         => ['nullable', 'integer', 'min:1'],
            'per_page'     => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
