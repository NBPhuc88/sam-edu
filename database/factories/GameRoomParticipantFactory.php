<?php

namespace Database\Factories;

use App\Models\GameRoomParticipant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GameRoomParticipant>
 */
class GameRoomParticipantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'game_room_id' => \App\Models\GameRoom::factory(), 'student_id' => \App\Models\Student::factory(), 'total_score' => 0, 'streak_count' => 0,
        ];
    }
}
