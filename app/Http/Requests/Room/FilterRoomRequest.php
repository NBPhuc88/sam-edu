<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;

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
            'status'    => ['nullable', 'string', 'in:all,active,paused,closed,inactive'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
