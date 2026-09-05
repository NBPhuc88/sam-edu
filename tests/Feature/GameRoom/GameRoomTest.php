<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\Student;
use App\Models\SubscriptionPlan;
use App\Models\Teacher;
use App\Services\GameRoom\GameRoomServiceInterface;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function () {
    $this->center  = Center::factory()->create();
    $this->teacher = Teacher::factory()->create(['center_id' => $this->center->id]);
    $this->student = Student::factory()->create(['center_id' => $this->center->id]);
    $this->exam    = Exam::factory()->create(['center_id' => $this->center->id]);
    ExamQuestion::factory()->count(3)->create(['exam_id' => $this->exam->id]);
    $this->service = app(GameRoomServiceInterface::class);
    $this->data    = ['exam_id' => $this->exam->id, 'question_time_limit' => 20, 'scoring_rules' => Constant::DEFAULT_GAME_ROOM_SCORING_RULES];
    $this->room    = $this->service->create($this->data, $this->teacher);
});

test('creates a snapshot and idempotent student membership without scoring the host', function () {
    $this->service->join($this->room->pin, $this->student);
    $this->service->join($this->room->pin, $this->student);
    $this->exam->questions()->update(['content' => 'Changed']);
    $state = $this->service->sync($this->room, $this->teacher);
    expect($state['participant_count'])->toBe(1)->and($state['is_host'])->toBeTrue()
        ->and($state['question'])->toBeNull()->and($this->room->questions[0]['content'])->toBe('Choose A')
        ->and($this->room->code)->toMatch('/^GR\d{7}$/');
});

test('rejects each written question type', function (int $type) {
    $this->exam->questions()->first()->update(['question_type' => $type]);
    expect(fn () => $this->service->create($this->data, $this->teacher))->toThrow(ValidationException::class);
})->with(Constant::GAME_ROOM_DISALLOWED_QUESTION_TYPES);

test('rejects cross center access and student hosting', function () {
    $outsider = Student::factory()->create();
    expect(fn () => $this->service->join($this->room->pin, $outsider))->toThrow(HttpException::class)
        ->and(fn () => $this->service->create($this->data, $this->student))->toThrow(HttpException::class)
        ->and(fn () => $this->service->sync($this->room, $this->student))->toThrow(HttpException::class);
});

test('awards speed points using server time and never scores a duplicate answer', function (float $seconds, int $points) {
    $this->freezeTime();
    $this->service->join($this->room->pin, $this->student);
    $this->service->start($this->room, $this->teacher);
    $this->travel((int) ($seconds * 1000))->milliseconds();
    $this->service->answer($this->room, ['question_index' => 0, 'answer' => 'A'], $this->student);
    $this->service->answer($this->room, ['question_index' => 0, 'answer' => 'B'], $this->student);
    $state = $this->service->sync($this->room, $this->student);
    expect($state['my_answer']['points'])->toBe($points)->and($state['answer_count'])->toBe(1)
        ->and($state['leaderboard'][0]['total_score'])->toBe($points)
        ->and($state['question'])->not->toHaveKey('correct_answer');
})->with([[0.5, 1000], [1.0, 800], [3.0, 600], [5.0, 400], [19.9, 400]]);

test('catches up across hidden tabs using absolute boundaries and completes the game', function () {
    $this->freezeTime();
    $this->service->join($this->room->pin, $this->student);
    $this->service->start($this->room, $this->teacher);
    $this->travel(20)->seconds();
    expect($this->service->sync($this->room, $this->student)['status'])->toBe(3);
    $this->travel(31)->seconds();
    $state = $this->service->sync($this->room, $this->student);
    expect($state['status'])->toBe(2)->and($state['question_index'])->toBe(2)
        ->and($state['expires_at'])->toBe(now()->addSeconds(19)->toISOString());
    $this->travel(19)->seconds();
    expect($this->service->sync($this->room, $this->student)['status'])->toBe(4);
});

test('rejects late answers stale questions and monitor answers', function () {
    $this->freezeTime();
    $this->service->join($this->room->pin, $this->student);
    $this->service->start($this->room, $this->teacher);
    expect(fn () => $this->service->answer($this->room, ['question_index' => 0, 'answer' => 'A'], $this->teacher))->toThrow(HttpException::class);
    $this->travel(20)->seconds();
    expect(fn () => $this->service->answer($this->room, ['question_index' => 0, 'answer' => 'A'], $this->student))->toThrow(HttpException::class);
    $this->travel(6)->seconds();
    expect(fn () => $this->service->answer($this->room, ['question_index' => 0, 'answer' => 'A'], $this->student))->toThrow(HttpException::class);
    expect($this->room->answers()->count())->toBe(0);
});

test('validates scoring windows and denies control to another teacher', function () {
    $this->data['scoring_rules'][1]['seconds'] = 0.5;
    expect(fn () => $this->service->create($this->data, $this->teacher))->toThrow(ValidationException::class);
    $monitor = Teacher::factory()->create(['center_id' => $this->center->id]);
    expect(fn () => $this->service->start($this->room, $monitor))->toThrow(HttpException::class);
    $this->service->cancel($this->room, $this->teacher);
    expect($this->service->sync($this->room, $this->teacher)['status'])->toBe(5);
});

test('grades all supported interactive answers', function (int $type, mixed $correct, mixed $answer) {
    expect($this->service->isCorrect(['question_type' => $type, 'correct_answer' => $correct], $answer))->toBeTrue();
    expect($this->service->isCorrect(['question_type' => $type, 'correct_answer' => $correct], null))->toBeFalse();
})->with([
    [1, 'A', 'a'], [2, ['A', 'B'], ['B', 'A']], [3, 'TRUE', 'true'], [11, 'A', 'A'],
    [5, ['blank_1'                         => 'word'], ['blank_1' => 'word']], [6, ['1' => 'a'], ['1' => 'a']],
    [7, ['1'                               => 'a'], ['1' => 'a']], [8, ['1' => 'a'], ['1' => 'a']],
    [9, ['b', 'a'], ['b', 'a']], [10, ['A' => 'one'], ['A' => 'one']],
]);

test('HTTP endpoints enforce role and input validation', function () {
    $this->actingAs($this->teacher, 'teacher')->postJson(route('game-rooms.store'), [...$this->data, 'question_time_limit' => 31])->assertUnprocessable();
    $this->actingAs($this->teacher, 'teacher')->postJson(route('game-rooms.store'), [...$this->data, 'question_time_limit' => 4])->assertUnprocessable();
    $this->actingAs($this->teacher, 'teacher')->postJson(route('game-rooms.store'), [...$this->data, 'question_time_limit' => 5])->assertRedirect();
    $this->actingAs($this->teacher, 'teacher')->postJson(route('game-rooms.store'), [...$this->data, 'scoring_rules' => []])->assertUnprocessable();
    $this->actingAs($this->teacher, 'teacher')->postJson(route('game-rooms.store'), [
        ...$this->data,
        'scoring_rules' => [
            ['seconds' => 5, 'points' => 1000],
            ['seconds' => 20, 'points' => 500],
        ],
    ])->assertRedirect();
    $this->actingAs($this->teacher, 'teacher')->getJson(route('game-rooms.sync', $this->room))->assertOk()->assertJsonPath('is_host', true);
    auth('teacher')->logout();
    $this->actingAs($this->student, 'student')->postJson(route('game-rooms.store'), $this->data)->assertForbidden();
    $this->postJson(route('game-rooms.join'), ['pin' => $this->room->pin])->assertRedirect();
    $this->getJson(route('game-rooms.sync', $this->room))->assertOk()->assertJsonPath('participant_count', 1);
});

test('resuming after many questions uses bounded writes and resets a missed streak', function () {
    $this->freezeTime();
    $this->room->update(['questions' => array_fill(0, 100, $this->room->questions[0])]);
    $this->service->join($this->room->pin, $this->student);
    $this->service->start($this->room, $this->teacher);
    $this->service->answer($this->room, ['question_index' => 0, 'answer' => 'A'], $this->student);
    $this->travel(1251)->seconds();
    DB::enableQueryLog();
    $state   = $this->service->sync($this->room, $this->student);
    $queries = DB::getQueryLog();
    DB::disableQueryLog();
    expect($state['question_index'])->toBe(50)
        ->and($state['leaderboard'][0]['streak_count'])->toBe(0)
        ->and($state['leaderboard'][0]['total_score'])->toBe(1000);
    $updates = array_filter($queries, fn (array $query): bool => str_starts_with(strtolower($query['query']), 'update'));
    expect(count($updates))->toBe(2);
});

test('game rooms preserve question and option order even when exam shuffle is enabled', function () {
    $this->exam->update(['shuffle_questions' => true, 'shuffle_options' => true]);
    $room = $this->service->create($this->data, $this->teacher);
    expect(array_column($room->questions, 'id'))->toBe($this->exam->questions()->pluck('id')->all())
        ->and($room->questions[0]['options'])->toBe($this->exam->questions()->first()->options);
});

test('redirects basic plan users to upgrade plan page for any game room url', function () {
    $basicCenter  = Center::factory()->create(['plan_type' => Constant::PLAN_TYPE_STANDARD]);
    $basicTeacher = Teacher::factory()->create(['center_id' => $basicCenter->id]);
    $basicStudent = Student::factory()->create(['center_id' => $basicCenter->id]);

    // Teacher on basic plan visits game-rooms index
    $this->actingAs($basicTeacher, 'teacher')
        ->get(route('game-rooms.index'))
        ->assertRedirect(route('upgrade-plan', ['feature' => 'game-rooms']));

    // Teacher on basic plan visits game-rooms create
    $this->actingAs($basicTeacher, 'teacher')
        ->get(route('game-rooms.create'))
        ->assertRedirect(route('upgrade-plan', ['feature' => 'game-rooms']));

    // Student on basic plan visits game-rooms index
    $this->actingAs($basicStudent, 'student')
        ->get(route('game-rooms.index'))
        ->assertRedirect(route('upgrade-plan', ['feature' => 'game-rooms']));

    // JSON requests from basic plan receive 403 Forbidden
    $this->actingAs($basicTeacher, 'teacher')
        ->postJson(route('game-rooms.store'), $this->data)
        ->assertForbidden();

    // Advanced plan center allows access
    $advancedPlan = SubscriptionPlan::create([
        'code'             => 'adv_gameroom_test',
        'name'             => 'Gói Nâng Cao Test',
        'plan_type'        => Constant::PLAN_TYPE_PREMIUM,
        'allowed_features' => ['game-rooms'],
        'duration_days'    => 30,
        'price'            => 500000,
    ]);
    $advancedCenter = Center::factory()->create([
        'plan_type'            => Constant::PLAN_TYPE_PREMIUM,
        'subscription_plan_id' => $advancedPlan->id,
    ]);
    $advancedTeacher = Teacher::factory()->create(['center_id' => $advancedCenter->id]);

    $this->actingAs($advancedTeacher, 'teacher')
        ->get(route('game-rooms.index'))
        ->assertOk();
});

test('redirects basic plan users to upgrade plan page for exam and grading urls', function () {
    $basicCenter  = Center::factory()->create(['plan_type' => Constant::PLAN_TYPE_STANDARD]);
    $basicTeacher = Teacher::factory()->create(['center_id' => $basicCenter->id]);
    $basicStudent = Student::factory()->create(['center_id' => $basicCenter->id]);

    // Exams index
    $this->actingAs($basicTeacher, 'teacher')
        ->get(route('exams.index'))
        ->assertRedirect(route('upgrade-plan', ['feature' => 'exams']));

    // Class exams index
    $this->actingAs($basicTeacher, 'teacher')
        ->get(route('class-exams.index'))
        ->assertRedirect(route('upgrade-plan', ['feature' => 'class-exams']));

    // Grading index
    $this->actingAs($basicTeacher, 'teacher')
        ->get(route('grading.index'))
        ->assertRedirect(route('upgrade-plan', ['feature' => 'grading']));

    // Online exam room
    $this->actingAs($basicStudent, 'student')
        ->get(route('online-exam.enter'))
        ->assertRedirect(route('upgrade-plan', ['feature' => 'online-exam']));

    // Practice exams
    $this->actingAs($basicStudent, 'student')
        ->get(route('practice-exams.index'))
        ->assertRedirect(route('upgrade-plan', ['feature' => 'practice-exams']));
});
