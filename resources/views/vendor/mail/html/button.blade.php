@props([
    'url',
    'color' => 'primary',
    'align' => 'center',
])
@php
    $bgColor = match ($color) {
        'success', 'green' => '#059669',
        'error', 'red'     => '#dc2626',
        default            => '#2563eb', // Royal Blue (#2563eb)
    };
@endphp
<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="{{ $align }}">
<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="{{ $align }}">
<table border="0" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td>
<a href="{{ $url }}" class="button button-{{ $color }}" target="_blank" rel="noopener" style="background-color: {{ $bgColor }}; color: #ffffff !important; border-top: 10px solid {{ $bgColor }}; border-bottom: 10px solid {{ $bgColor }}; border-left: 24px solid {{ $bgColor }}; border-right: 24px solid {{ $bgColor }}; border-radius: 6px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block;">{!! $slot !!}</a>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
