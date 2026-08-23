<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
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
            'center_id' => ['required', 'integer', 'exists:centers,id'],
            'name'      => ['required', 'string', 'max:50'],
            'code'      => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('rooms', 'code')->where(function ($query) {
                    return $query->where('center_id', $this->input('center_id'))
                        ->whereNull('deleted_at');
                }),
            ],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:500'],
            'location' => ['nullable', 'string', 'max:255'],
            'status'   => ['nullable', 'string', 'in:active,inactive'],

            'equipments'            => ['nullable', 'array'],
            'equipments.*.name'     => ['required_with:equipments', 'string', 'max:255'],
            'equipments.*.quantity' => ['required_with:equipments', 'integer', 'min:1'],
            'equipments.*.unit'     => ['nullable', 'string', 'max:50'],
            'equipments.*.status'   => ['nullable', 'string', 'in:good,maintenance,broken'],
            'equipments.*.note'     => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required' => 'Vui lòng chọn Trung tâm đào tạo.',
            'center_id.exists'   => 'Trung tâm đã chọn không tồn tại.',
            'name.required'      => 'Vui lòng nhập tên phòng học.',
            'name.max'           => 'Tên phòng học không được vượt quá 50 ký tự.',
            'code.max'           => 'Mã phòng học không được vượt quá 20 ký tự.',
            'code.regex'         => 'Mã phòng học chỉ được chứa ký tự chữ số và gạch ngang.',
            'code.unique'        => 'Mã phòng học đã tồn tại trong trung tâm này.',
            'capacity.min'       => 'Sức chứa phòng học phải lớn hơn hoặc bằng 1.',
            'capacity.max'       => 'Sức chứa phòng học không được vượt quá 500.',
        ];
    }
}
