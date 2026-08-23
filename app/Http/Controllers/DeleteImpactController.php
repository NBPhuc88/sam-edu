<?php

namespace App\Http\Controllers;

use App\Services\Impact\DeleteImpactServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeleteImpactController extends Controller
{
    public function __construct(
        protected DeleteImpactServiceInterface $deleteImpactService
    ) {
    }

    /**
     * Get impact summary before deleting an entity.
     *
     * @param  Request      $request
     * @param  string       $entity
     * @param  int          $id
     * @return JsonResponse
     */
    public function getImpact(Request $request, string $entity, int $id): JsonResponse
    {
        $result = $this->deleteImpactService->getImpact($entity, $id);

        if (isset($result['error'])) {
            return response()->json(['error' => $result['error']], $result['status'] ?? 400);
        }

        return response()->json($result);
    }
}
