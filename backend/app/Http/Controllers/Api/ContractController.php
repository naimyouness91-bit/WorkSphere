<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Compliance\SignContractRequest;
use App\Http\Requests\Compliance\StoreContractRequest;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Models\User;
use App\Services\ComplianceService;
use App\Services\ContractSigningService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractController extends Controller
{
    public function __construct(
        private ComplianceService $compliance,
        private ContractSigningService $signing,
        private NotificationService $notifications,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Contract::query()
            ->with(['employee:id,name,email', 'signature'])
            ->orderByDesc('created_at');

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        } elseif ($request->filled('employee_id') && $this->canManage($user)) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $contracts = $query->get()->each(fn (Contract $c) => $c->refreshStatus());

        return ContractResource::collection($contracts);
    }

    public function store(StoreContractRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.compliance.forbidden')], 403);
        }

        $contract = $this->compliance->publishContract(
            $user,
            $request->validated(),
            $request->file('file'),
        );

        $contract->load(['employee:id,name,email']);

        return response()->json([
            'message' => __('messages.compliance.contract_published'),
            'data' => new ContractResource($contract),
        ], 201);
    }

    public function sign(SignContractRequest $request, Contract $contract): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        try {
            $contract = $this->signing->sign(
                $contract,
                $user,
                $request->validated('signature_data'),
                $request,
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->notifications->notifyContractSigned($contract);

        return response()->json([
            'message' => __('messages.compliance.contract_signed'),
            'data' => new ContractResource($contract),
        ]);
    }

    public function download(Contract $contract): StreamedResponse|JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $contract)) {
            return response()->json(['message' => __('messages.compliance.forbidden')], 403);
        }

        $path = $contract->signed_contract_path ?? $contract->contract_file_path;
        $filename = $contract->signed_contract_path
            ? 'signed_'.$contract->original_filename
            : $contract->original_filename;

        if (! Storage::disk('local')->exists($path)) {
            return response()->json(['message' => __('messages.compliance.file_missing')], 404);
        }

        return Storage::disk('local')->download($path, $filename);
    }

    public function preview(Contract $contract): StreamedResponse|JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $contract)) {
            return response()->json(['message' => __('messages.compliance.forbidden')], 403);
        }

        $path = $contract->contract_file_path;

        if (! Storage::disk('local')->exists($path)) {
            return response()->json(['message' => __('messages.compliance.file_missing')], 404);
        }

        if ($contract->mime_type === 'application/pdf') {
            return response()->file(
                Storage::disk('local')->path($path),
                ['Content-Type' => 'application/pdf'],
            );
        }

        return $this->download($contract);
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }

    private function canAccess(User $user, Contract $contract): bool
    {
        if ($this->canManage($user)) {
            return true;
        }

        return $contract->isOwnedBy($user);
    }
}
