<?php

namespace App\Http\Requests\Schedule;

use App\Enums\Constant;
use App\Models\ClassSchedule;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateClassScheduleRequest extends FormRequest
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
            'teacher_id'              => ['sometimes', 'required', 'integer', 'exists:teachers,id'],
            'room_id'                 => ['nullable', 'integer', 'exists:rooms,id'],
            'start_date'              => ['sometimes', 'required', 'date'],
            'end_date'                => ['nullable', 'date', 'after_or_equal:start_date'],
            'weeks'                   => ['nullable', 'array'],
            'auto_holidays'           => ['nullable', 'boolean'],
            'excluded_holiday_ids'    => ['nullable', 'array'],
            'excluded_holiday_ids.*'  => ['integer'],
            'off_days'                => ['nullable', 'array'],
            'off_days.*.date'         => ['required_with:off_days', 'date'],
            'off_days.*.start_time'   => ['nullable', 'string'],
            'off_days.*.end_time'     => ['nullable', 'string'],
            'extra_days'              => ['nullable', 'array'],
            'extra_days.*.date'       => ['required_with:extra_days', 'date'],
            'extra_days.*.start_time' => ['required_with:extra_days', 'string'],
            'extra_days.*.end_time'   => ['required_with:extra_days', 'string'],
            'status'                  => ['nullable', 'integer', Rule::in(Constant::SCHEDULE_STATUSES)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'teacher_id.required'     => 'Vui lòng chọn giáo viên giảng dạy.',
            'start_date.required'     => 'Vui lòng chọn ngày bắt đầu.',
            'end_date.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $scheduleId = $this->route('schedule') ?? $this->route('id');

            if (! $scheduleId) {
                return;
            }

            $schedule    = ClassSchedule::with('classSubject.schoolClass')->find($scheduleId);
            $schoolClass = $schedule?->classSubject?->schoolClass;

            if ($schoolClass && $this->has('status')) {
                $newStatus = (int) $this->input('status');
                $oldStatus = (int) $schedule->status;

                if ($newStatus !== $oldStatus && (int) $schoolClass->status !== Constant::CLASS_STATUS_ACTIVE) {
                    $validator->errors()->add('status', 'Chỉ có thể thay đổi trạng thái lịch học khi lớp học ở trạng thái Đang hoạt động.');
                }
            }

            if (! $schoolClass || ! $schoolClass->start_date) {
                return;
            }

            $classStartDate      = Carbon::parse($schoolClass->start_date)->format('Y-m-d');
            $classStartFormatted = Carbon::parse($schoolClass->start_date)->format('d-m-Y');

            if ($this->input('start_date')) {
                $startDate = Carbon::parse($this->input('start_date'))->format('Y-m-d');

                if ($startDate < $classStartDate) {
                    $validator->errors()->add('start_date', "Ngày bắt đầu lịch học không được nhỏ hơn ngày bắt đầu của lớp ({$classStartFormatted}).");
                }
            }

            if (is_array($this->input('off_days'))) {
                foreach ($this->input('off_days') as $index => $off) {
                    if (! empty($off['date'])) {
                        $offDate = Carbon::parse($off['date'])->format('Y-m-d');

                        if ($offDate < $classStartDate) {
                            $validator->errors()->add("off_days.{$index}.date", "Ngày nghỉ không được nhỏ hơn ngày bắt đầu của lớp ({$classStartFormatted}).");
                        }
                    }
                }
            }

            if (is_array($this->input('extra_days'))) {
                foreach ($this->input('extra_days') as $index => $extra) {
                    if (! empty($extra['date'])) {
                        $extraDate = Carbon::parse($extra['date'])->format('Y-m-d');

                        if ($extraDate < $classStartDate) {
                            $validator->errors()->add("extra_days.{$index}.date", "Ngày học bù không được nhỏ hơn ngày bắt đầu của lớp ({$classStartFormatted}).");
                        }
                    }
                }
            }
        });
    }
}
