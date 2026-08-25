<?php

namespace App\Repositories\Subscription;

use App\Models\SubscriptionPlan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SubscriptionPlanRepository implements SubscriptionPlanRepositoryInterface
{
    /**
     * @return Collection<int, SubscriptionPlan>
     */
    public function getAllOrderedByPrice(): Collection
    {
        return SubscriptionPlan::select(
            'id',
            'code',
            'name',
            'plan_type',
            'price',
            'yearly_price',
            'duration_days',
            'max_students',
            'max_classes',
            'features',
            'is_featured',
            'badge_text'
        )->orderBy('price', 'asc')
        ->get();
    }

    public function getPaginatedPlans(?string $search = null, ?string $type = null, int $perPage = 20, int $page = 1): LengthAwarePaginator
    {
        $query = SubscriptionPlan::query()
        ->select(
            'id',
            'code',
            'name',
            'plan_type',
            'price',
            'yearly_price',
            'duration_days',
            'max_students',
            'max_classes',
            'features',
            'is_featured',
            'badge_text',
            'created_at'
        );

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%")
                    ->orWhere('badge_text', 'like', "%{$term}%");
            });
        }

        if ($type === 'free') {
            $query->where('price', 0);
        } elseif ($type === 'paid') {
            $query->where('price', '>', 0);
        } elseif ($type === 'featured') {
            $query->where('is_featured', true);
        }

        return $query->orderBy('price', 'asc')
            ->orderBy('id', 'asc')
            ->deferredPaginate($perPage, ['*'], 'page', $page)
            ->withQueryString();
    }

    public function findByCode(string $code): ?SubscriptionPlan
    {
        return SubscriptionPlan::where('code', $code)->first();
    }

    public function findById(int $id): ?SubscriptionPlan
    {
        return SubscriptionPlan::find($id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): SubscriptionPlan
    {
        return SubscriptionPlan::create($data);
    }

    /**
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function update(int $id, array $data): SubscriptionPlan
    {
        $plan = $this->findById($id);

        if (! $plan) {
            throw new \RuntimeException("Không tìm thấy gói cước với ID {$id}");
        }

        $plan->update($data);

        return $plan->fresh();
    }

    public function delete(int $id): bool
    {
        $plan = $this->findById($id);

        if (! $plan) {
            return false;
        }

        return (bool) $plan->delete();
    }

    /**
     * @return array<string, int>
     */
    public function getStats(): array
    {
        return [
            'total'    => SubscriptionPlan::count(),
            'free'     => SubscriptionPlan::where('price', 0)->count(),
            'paid'     => SubscriptionPlan::where('price', '>', 0)->count(),
            'featured' => SubscriptionPlan::where('is_featured', true)->count(),
        ];
    }

    public function getNextPlanCode(): string
    {
        $maxId  = (int) SubscriptionPlan::max('id');
        $nextId = $maxId + 1;

        do {
            $candidate = sprintf('PLAN%09d', $nextId);
            $exists    = SubscriptionPlan::where('code', $candidate)->exists();

            if (! $exists) {
                return $candidate;
            }
            $nextId++;
        } while (true);
    }
}
