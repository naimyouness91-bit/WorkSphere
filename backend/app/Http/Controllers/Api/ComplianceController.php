<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\ContractResource;
use App\Http\Resources\PolicyResource;
use App\Models\User;
use App\Services\ComplianceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplianceController extends Controller
{
    public function __construct(
        private ComplianceService $compliance,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $user = $request->user('api');
        $data = $this->compliance->overview($user);

        return response()->json([
            'data' => [
                'stats' => $data['stats'],
                'can_manage' => $data['can_manage'],
                'policies' => PolicyResource::collection($data['policies'])->resolve(),
                'contracts' => ContractResource::collection($data['contracts'])->resolve(),
                'expiring_soon' => $data['expiring_soon'],
            ],
        ]);
    }

    public function report(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if ($user->role !== UserRole::Admin && $user->role !== UserRole::Manager) {
            return response()->json(['message' => __('messages.compliance.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->compliance->complianceReport(),
        ]);
    }
}
