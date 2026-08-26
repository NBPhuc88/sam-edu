<?php

use App\Models\SubscriptionPlan;
use App\Services\Subscription\SubscriptionPlanService;

beforeEach(function () {
    $this->service = app(SubscriptionPlanService::class);
});

test('createPlan creates subscription plan and formats values', function () {
    $data = [
        'name'         => 'Goi Trung Cap 6 Thang',
        'price'        => 3000000,
        'max_students' => 200,
        'max_classes'  => 20,
    ];

    $plan = $this->service->createPlan($data);

    expect($plan)->toBeInstanceOf(SubscriptionPlan::class)
        ->and($plan->name)->toBe('Goi Trung Cap 6 Thang')
        ->and((float) $plan->price)->toBe(3000000.0)
        ->and($plan->max_students)->toBe(200);
});

test('getPlanById throws RuntimeException when plan does not exist', function () {
    expect(fn () => $this->service->getPlanById(999999))
        ->toThrow(\RuntimeException::class);
});

test('updatePlan updates plan price and max_students', function () {
    $plan = SubscriptionPlan::create([
        'code'         => 'PLAN' . random_int(1000, 9999),
        'name'         => 'Goi Basic Old',
        'price'        => 1000000,
        'max_students' => 50,
    ]);

    $updated = $this->service->updatePlan($plan->id, [
        'name'         => 'Goi Basic New',
        'price'        => 1200000,
        'max_students' => 60,
    ]);

    expect($updated->name)->toBe('Goi Basic New')
        ->and((float) $updated->price)->toBe(1200000.0)
        ->and($updated->max_students)->toBe(60);
});

test('deletePlan deletes subscription plan', function () {
    $plan = SubscriptionPlan::create([
        'code'  => 'PLAN' . random_int(1000, 9999),
        'name'  => 'Goi To Delete',
        'price' => 500000,
    ]);

    $result = $this->service->deletePlan($plan->id);

    expect($result)->toBeTrue();
    $this->assertDatabaseMissing('subscription_plans', ['id' => $plan->id]);
});
