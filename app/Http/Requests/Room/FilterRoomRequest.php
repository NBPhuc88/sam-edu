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
            'center_id' => ['nullable', 'integer', 'exists:centers,id'],
            'status'    => ['nullable', 'string', Rule::in(array_merge(['all', Constant::STATUS_INACTIVE], Constant::ROOM_STATUSES))],
            'page'      => ['nullable', 'integer', 'min:1'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
