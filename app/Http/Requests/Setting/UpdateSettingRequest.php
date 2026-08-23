<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'settings'                   => ['nullable', 'array'],
            'settings.company_name'      => ['nullable', 'string', 'max:255'],
            'settings.contact_address'   => ['nullable', 'string', 'max:255'],
            'settings.contact_phone'     => ['nullable', 'string', 'max:50'],
            'settings.contact_email'     => ['nullable', 'email', 'max:100'],
            'settings.hero_title'        => ['nullable', 'string', 'max:255'],
            'settings.hero_subtitle'     => ['nullable', 'string', 'max:500'],
            'settings.promo_banner_text' => ['nullable', 'string', 'max:500'],

            'seo'                 => ['nullable', 'array'],
            'seo.*.title'         => ['nullable', 'string', 'max:255'],
            'seo.*.description'   => ['nullable', 'string', 'max:500'],
            'seo.*.keywords'      => ['nullable', 'string', 'max:500'],
            'seo.*.og_image'      => ['nullable', 'string', 'max:255'],
            'seo.*.canonical_url' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'settings.contact_email.email' => 'Địa chỉ email hỗ trợ không đúng định dạng.',
            'settings.company_name.max'    => 'Tên công ty không được vượt quá 255 ký tự.',
            'settings.contact_address.max' => 'Địa chỉ không được vượt quá 255 ký tự.',
            'settings.contact_phone.max'   => 'Số điện thoại không được vượt quá 50 ký tự.',
            'settings.hero_title.max'      => 'Tiêu đề banner chính không được vượt quá 255 ký tự.',
            'settings.hero_subtitle.max'   => 'Mô tả banner chính không được vượt quá 500 ký tự.',
        ];
    }
}
