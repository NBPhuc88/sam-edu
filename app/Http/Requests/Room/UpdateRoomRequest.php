<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomRequest extends FormRequest
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
        $roomId = (int) $this->route('id');

        return [
            'center_id' => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'name'      => ['sometimes', 'required', 'string', 'max:255'],
            'code'      => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('rooms', 'code')->where(function ($query) {
                    $centerId = $this->input('center_id') ?? $this->route('room')?->center_id;

                    return $query->where('center_id', $centerId)
                        ->whereNull('deleted_at');
                })->ignore($roomId),
            ],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
            'status'   => ['sometimes', 'required', 'string', 'in:active,inactive'],
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
