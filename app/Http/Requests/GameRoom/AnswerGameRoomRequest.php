<?php

namespace App\Http\Requests\GameRoom;

use Illuminate\Foundation\Http\FormRequest;

class AnswerGameRoomRequest extends FormRequest
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
        return ['question_index' => ['required', 'integer', 'min:0'], 'answer' => ['present'], 'answer.*' => ['nullable', 'string', 'max:1000']];
    }
}
