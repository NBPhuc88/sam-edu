<?php

namespace Database\Factories;

use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'center_id' => \App\Models\Center::factory(), 'teacher_code' => fake()->unique()->bothify('TC########'), 'username' => fake()->unique()->userName(), 'password' => 'password', 'first_name' => fake()->firstName(), 'last_name' => fake()->lastName(), 'full_name' => fake()->name(), 'status' => \App\Enums\Constant::TEACHER_STATUS_ACTIVE,
        ];
    }
}
