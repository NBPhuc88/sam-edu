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
            'name'      => ['required', 'string', 'max:255'],
            'code'      => [
                'required',
                'string',
                'max:50',
                Rule::unique('rooms', 'code')->where(function ($query) {
                    return $query->where('center_id', $this->input('center_id'))
                        ->whereNull('deleted_at');
                }),
            ],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
            'status'   => ['nullable', 'string', 'in:active,inactive'],
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
            'code.required'      => 'Vui lòng nhập mã phòng học.',
            'code.unique'        => 'Mã phòng học đã tồn tại trong trung tâm này.',
            'capacity.min'       => 'Sức chứa phòng học phải lớn hơn hoặc bằng 1.',
        ];
    }
}
