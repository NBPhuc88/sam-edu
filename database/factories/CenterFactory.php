<?php

namespace Database\Factories;

use App\Models\Center;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Center>
 */
class CenterFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('CTR########'), 'name' => fake()->company(), 'status' => 1,
        ];
    }
}
