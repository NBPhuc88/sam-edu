<?php

namespace App\Http\Requests\GameRoom;

use Illuminate\Foundation\Http\FormRequest;

class ReactGameRoomRequest extends FormRequest
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
        return ['emoji' => ['required', 'string', \Illuminate\Validation\Rule::in(['🔥', '👏', '⚡', '❤️'])]];
    }
}
