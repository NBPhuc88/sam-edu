<?php

namespace App\Models;

use App\Enums\Constant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
 * @property int|null    $subscription_plan_id
 * @property int         $plan_type
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
        'subscription_plan_id',
        'plan_type',
        'expires_at',
        'trial_ends_at',
        'max_students',
        'max_classes',
    ];

    protected function casts(): array
    {
        return [
            'status'               => 'integer',
            'subscription_plan_id' => 'integer',
            'plan_type'            => 'integer',
            'expires_at'           => 'datetime:d-m-Y H:i',
            'trial_ends_at'        => 'datetime:d-m-Y H:i',
            'max_students'         => 'integer',
            'max_classes'          => 'integer',
            'created_at'           => 'datetime:d-m-Y H:i',
            'updated_at'           => 'datetime:d-m-Y H:i',
        ];
    }

    /**
     * @return BelongsTo<SubscriptionPlan, $this>
     */
    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function currentPlan(): ?SubscriptionPlan
    {
        if ($this->relationLoaded('subscriptionPlan') && $this->subscriptionPlan) {
            return $this->subscriptionPlan;
        }

        if ($this->subscription_plan_id) {
            return SubscriptionPlan::find($this->subscription_plan_id);
        }

        return null;
    }

    public function getStatusLabelAttribute(): string
    {
        return Constant::CENTER_STATUS_LABELS[(int) $this->status] ?? 'Đang hoạt động';
    }

    public function getPlanNameAttribute(): string
    {
        return $this->currentPlan()?->name ?? 'Gói Dùng Thử';
    }

    /**
     * Kiểm tra trung tâm đã hết hạn gói cước chưa.
     * Quy tắc: Trong ngày hết hạn vẫn cho phép hoạt động và đăng nhập bình thường,
     * chỉ bắt đầu tính hết hạn sau 23:00 của ngày hết hạn đó.
     */
    public function isExpired(): bool
    {
        if (! $this->expires_at) {
            return false;
        }

        $cutoff = $this->expires_at->copy()->setTime(23, 0, 0);

        return now()->greaterThan($cutoff);
    }

    public function hasFeature(string $featureCode): bool
    {
        $planType = $this->plan_type ? (int) $this->plan_type : (int) ($this->currentPlan()?->plan_type ?? Constant::PLAN_TYPE_FREE);

        if ($planType === Constant::PLAN_TYPE_FREE) {
            return true;
        }

        $plan = $this->currentPlan();

        return $plan ? $plan->hasFeature($featureCode) : false;
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
     * @return HasMany<Subject, $this>
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
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
