<?php

namespace App\Http\Requests\Room;

use App\Enums\Constant;
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
            'name'      => ['sometimes', 'required', 'string', 'max:50'],
            'code'      => [
                'sometimes',
                'required',
                'string',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('rooms', 'code')->whereNull('deleted_at')->ignore($roomId),
            ],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:500'],
            'location' => ['nullable', 'string', 'max:255'],
            'status'   => ['sometimes', 'required', 'integer', Rule::in(array_merge(Constant::ROOM_STATUSES, [Constant::STATUS_INACTIVE]))],

            'equipments'            => ['nullable', 'array'],
            'equipments.*.id'       => ['nullable', 'integer'],
            'equipments.*.name'     => ['required_with:equipments', 'string', 'max:255'],
            'equipments.*.quantity' => ['required_with:equipments', 'integer', 'min:1'],
            'equipments.*.unit'     => ['nullable', 'string', 'max:50'],
            'equipments.*.status'   => ['nullable', 'integer', Rule::in(Constant::ROOM_EQUIPMENT_STATUSES)],
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
            'code.required'      => 'Vui lòng nhập mã phòng học.',
            'code.max'           => 'Mã phòng học không được vượt quá 20 ký tự.',
            'code.regex'         => 'Mã phòng học chỉ được chứa ký tự chữ số và gạch ngang.',
            'code.unique'        => 'Mã phòng học đã tồn tại trong trung tâm này.',
            'capacity.min'       => 'Sức chứa phòng học phải lớn hơn hoặc bằng 1.',
            'capacity.max'       => 'Sức chứa phòng học không được vượt quá 500.',
        ];
    }
}
