<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'center_id' => \App\Models\Center::factory(), 'student_code' => fake()->unique()->bothify('ST########'), 'first_name' => fake()->firstName(), 'last_name' => fake()->lastName(), 'full_name' => fake()->name(), 'status' => \App\Enums\Constant::STUDENT_STATUS_ACTIVE,
        ];
    }
}
