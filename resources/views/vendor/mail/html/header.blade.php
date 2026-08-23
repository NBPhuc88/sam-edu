@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block; text-decoration: none; color: #059669; font-size: 19px; font-weight: 900; letter-spacing: 0.5px;">
@if (trim($slot) === 'Laravel')
{{ config('app.name', 'Giáo Dục Sam') }}
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
