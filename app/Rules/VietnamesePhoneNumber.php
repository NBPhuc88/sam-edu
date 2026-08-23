<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VietnamesePhoneNumber implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString $fail
     * @param string                                                                          $attribute
     * @param mixed                                                                           $value
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            return;
        }

        // Standard VN phone: 10 digits starting with 03, 05, 07, 08, 09 or +84 / 84
        $pattern = '/^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/';

        if (! preg_match($pattern, trim($value))) {
            $fail('Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0912345678 hoặc +84912345678).');
        }
    }
}
