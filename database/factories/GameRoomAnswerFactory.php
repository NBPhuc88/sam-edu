<?php

namespace Database\Factories;

use App\Models\GameRoomAnswer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GameRoomAnswer>
 */
class GameRoomAnswerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'game_room_participant_id' => \App\Models\GameRoomParticipant::factory(), 'game_room_id' => fn (array $attributes) => \App\Models\GameRoomParticipant::findOrFail($attributes['game_room_participant_id'])->game_room_id, 'question_index' => 0, 'answer' => 'A', 'response_seconds' => 0.5, 'is_correct' => true, 'points' => 1000,
        ];
    }
}
