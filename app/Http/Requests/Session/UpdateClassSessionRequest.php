<?php

namespace App\Http\Requests\Session;

use App\Enums\Constant;
use App\Models\ClassSession;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateClassSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('session_date') && ! empty($this->session_date) && is_string($this->session_date)) {
            try {
                $parsed = Carbon::parse($this->session_date)->format('Y-m-d');
                $this->merge(['session_date' => $parsed]);
            } catch (\Throwable) {
                // Keep original to let validator report error
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'session_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'start_time'   => ['sometimes', 'required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'end_time'     => ['sometimes', 'required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/', 'after:start_time'],
            'teacher_id'   => ['sometimes', 'required', 'integer', 'exists:teachers,id'],
            'room_id'      => ['nullable', 'integer', 'exists:rooms,id'],
            'status'       => ['sometimes', 'required', 'integer', Rule::in(Constant::SESSION_STATUSES)],
            'topic'        => ['nullable', 'string', 'max:255'],
            'note'         => ['nullable', 'string', 'max:1000'],
            'reason'       => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'session_date.required'    => 'Vui lòng chọn ngày học.',
            'session_date.date_format' => 'Định dạng ngày học không hợp lệ (Y-m-d).',
            'start_time.required'      => 'Vui lòng chọn giờ bắt đầu.',
            'end_time.required'        => 'Vui lòng chọn giờ kết thúc.',
            'end_time.after'           => 'Giờ kết thúc phải sau giờ bắt đầu.',
            'teacher_id.required'      => 'Vui lòng chọn giáo viên phụ trách.',
            'teacher_id.exists'        => 'Giáo viên được chọn không tồn tại.',
            'room_id.exists'           => 'Phòng học được chọn không tồn tại.',
            'status.required'          => 'Vui lòng chọn trạng thái buổi học.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $sessionId = $this->route('session') ?? $this->route('id');

            if (! $sessionId || ! $this->input('session_date')) {
                return;
            }

            $session     = ClassSession::with('classSubject.schoolClass')->find($sessionId);
            $schoolClass = $session?->classSubject?->schoolClass;

            if (! $schoolClass || ! $schoolClass->start_date) {
                return;
            }

            $classStartDate   = ($schoolClass && $schoolClass->start_date) ? Carbon::parse($schoolClass->start_date)->format('Y-m-d') : null;
            $todayIso         = now()->toDateString();
            $minDateIso       = ($classStartDate && $classStartDate > $todayIso) ? $classStartDate : $todayIso;
            $minDateFormatted = Carbon::parse($minDateIso)->format('d-m-Y');
            $sessionDate      = Carbon::parse($this->input('session_date'))->format('Y-m-d');

            if ($sessionDate < $minDateIso) {
                $validator->errors()->add('session_date', "Ngày học không được nhỏ hơn ngày hiện tại ({$minDateFormatted}).");
            }
        });
    }
}
