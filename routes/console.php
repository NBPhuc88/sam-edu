<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

$sessionsLogDir = storage_path('logs/sessions-update/' . date('Y-m'));

if (! is_dir($sessionsLogDir)) {
    @mkdir($sessionsLogDir, 0755, true);
}

Schedule::command('sessions:update-status')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->appendOutputTo($sessionsLogDir . '/' . (int) date('j') . '.log');

$classExamsLogDir = storage_path('logs/class-exams-update/' . date('Y-m'));

if (! is_dir($classExamsLogDir)) {
    @mkdir($classExamsLogDir, 0755, true);
}

Schedule::command('class-exams:update-status')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->appendOutputTo($classExamsLogDir . '/' . (int) date('j') . '.log');

Schedule::command('logs:clean-old')
    ->monthlyOn(1, '00:00')
    ->withoutOverlapping();

Schedule::command('centers:notify-expiring-subscription')
    ->dailyAt('08:00')
    ->withoutOverlapping();
