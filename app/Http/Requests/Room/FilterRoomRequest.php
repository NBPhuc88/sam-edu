<?php

namespace App\Http\Requests\Room;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterRoomRequest extends FormRequest
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
            'search'    => ['nullable', 'string', 'max:255'],
            'center_id' => ['nullable', 'integer'],
            'status'    => ['nullable', 'integer', Rule::in(array_merge(Constant::ROOM_STATUSES, [Constant::STATUS_INACTIVE]))],
            'page'      => ['nullable', 'integer', 'min:1'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
