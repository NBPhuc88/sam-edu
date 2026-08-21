<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomEquipment extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'room_equipments';

    protected $fillable = [
        'room_id',
        'name',
        'quantity',
        'unit',
        'status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'quantity'   => 'integer',
            'created_at' => 'datetime:d-m-Y H:i',
            'updated_at' => 'datetime:d-m-Y H:i',
            'deleted_at' => 'datetime:d-m-Y H:i',
        ];
    }

    /**
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
