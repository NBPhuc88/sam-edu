<?php

namespace App\Http\Requests\GameRoom;

use Illuminate\Foundation\Http\FormRequest;

class StoreGameRoomRequest extends FormRequest
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
            'exam_id'                 => ['required', 'integer', 'exists:exams,id'],
            'question_time_limit'     => ['required', 'integer', 'between:5,30'],
            'scoring_rules'           => ['required', 'array', 'min:1'],
            'scoring_rules.*'         => ['required', 'array:seconds,points'],
            'scoring_rules.*.seconds' => ['required', 'numeric', 'gt:0', 'max:30'],
            'scoring_rules.*.points'  => ['required', 'integer', 'between:0,10000'],
        ];
    }
}
