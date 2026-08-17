<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int         $id
 * @property string      $code
 * @property string      $name
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $address
 * @property string      $status
 * @property string      $subscription_plan
 * @property Carbon|null $expires_at
 * @property Carbon|null $trial_ends_at
 * @property int|null    $max_students
 * @property int|null    $max_classes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
class Center extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'phone',
        'email',
        'address',
        'status',
        'subscription_plan',
        'expires_at',
        'trial_ends_at',
        'max_students',
        'max_classes',
    ];

    protected function casts(): array
    {
        return [
            'expires_at'    => 'datetime',
            'trial_ends_at' => 'datetime',
            'max_students'  => 'integer',
            'max_classes'   => 'integer',
        ];
    }

    /**
     * @return BelongsToMany<Admin, $this>
     */
    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(Admin::class, 'admin_centers');
    }

    /**
     * @return HasMany<Teacher, $this>
     */
    public function teachers(): HasMany
    {
        return $this->hasMany(Teacher::class);
    }

    /**
     * @return HasMany<Student, $this>
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    /**
     * @return HasMany<Room, $this>
     */
    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    /**
     * @return HasMany<CenterSubject, $this>
     */
    public function centerSubjects(): HasMany
    {
        return $this->hasMany(CenterSubject::class);
    }

    /**
     * @return HasMany<SchoolClass, $this>
     */
    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    /**
     * @return HasMany<CenterSubscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(CenterSubscription::class);
    }

    /**
     * @return HasMany<PaymentTransaction, $this>
     */
    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }
}
