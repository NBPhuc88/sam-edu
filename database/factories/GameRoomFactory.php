<?php

namespace Database\Factories;

use App\Models\GameRoom;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GameRoom>
 */
class GameRoomFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'center_id' => \App\Models\Center::factory(), 'name' => 'Live Quiz', 'pin' => fake()->unique()->numerify('######'), 'questions' => [['id' => 1, 'title' => 'Quiz', 'content' => 'Choose A', 'question_type' => 1, 'options' => [['key' => 'A', 'text' => 'First']], 'correct_answer' => 'A']], 'scoring_rules' => \App\Enums\Constant::DEFAULT_GAME_ROOM_SCORING_RULES, 'question_time_limit' => 20, 'countdown_seconds' => 5, 'status' => 1, 'question_index' => 0,
        ];
    }
}
