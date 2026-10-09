<?php

namespace App\Services;

use App\Enums\ContractStatus;
use App\Enums\UserRole;
use App\Models\Contract;
use App\Models\Policy;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ComplianceService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function uploadPolicy(User $admin, array $data, UploadedFile $file): Policy
    {
        $code = $data['code'] ?? Str::slug($data['title']);
        $code = Str::limit($code, 80, '');

        $previous = Policy::where('code', $code)->where('is_current', true)->first();
        $version = $previous ? $previous->version + 1 : 1;

        if ($previous) {
            $previous->update(['is_current' => false]);
        }

        $path = $file->store('compliance/policies/'.$code.'/v'.$version, 'local');

        $policy = Policy::create([
            'code' => $code,
            'version' => $version,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/pdf',
            'file_size' => $file->getSize(),
            'effective_date' => $data['effective_date'],
            'is_current' => true,
            'created_by' => $admin->id,
            'supersedes_id' => $previous?->id,
        ]);

        $this->notifications->notifyPolicyPublished($policy);

        return $policy;
    }

    public function publishContract(User $publisher, array $data, UploadedFile $file): Contract
    {
        $path = $file->store('compliance/contracts/'.$data['employee_id'], 'local');

        $contract = Contract::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'employee_id' => $data['employee_id'],
            'contract_file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/pdf',
            'status' => ContractStatus::Pending,
            'expires_at' => $data['expires_at'] ?? null,
            'published_by' => $publisher->id,
        ]);

        $contract->load('employee');
        $this->notifications->notifyContractPublished($contract);

        return $contract;
    }

    public function expireStaleContracts(): void
    {
        Contract::query()
            ->where('status', ContractStatus::Pending)
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '<', Carbon::today())
            ->each(fn (Contract $c) => $c->update(['status' => ContractStatus::Expired]));
    }

    /**
     * @return array<int, Contract>
     */
    public function expiringSoon(int $withinDays = 14): array
    {
        $this->expireStaleContracts();

        return Contract::query()
            ->with('employee:id,name,email')
            ->where('status', ContractStatus::Pending)
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [Carbon::today(), Carbon::today()->addDays($withinDays)])
            ->orderBy('expires_at')
            ->get()
            ->all();
    }

    public function statsForDashboard(User $user): array
    {
        $this->expireStaleContracts();

        $isEmployee = $user->role === UserRole::Employee;

        $contractsQuery = Contract::query();
        if ($isEmployee) {
            $contractsQuery->where('employee_id', $user->id);
        }

        $pending = (clone $contractsQuery)->where('status', ContractStatus::Pending)->count();
        $signed = (clone $contractsQuery)->where('status', ContractStatus::Signed)->count();
        $expired = (clone $contractsQuery)->where('status', ContractStatus::Expired)->count();

        $expiringSoon = $isEmployee
            ? count($this->expiringSoonForUser($user))
            : Contract::where('status', ContractStatus::Pending)
                ->whereNotNull('expires_at')
                ->whereBetween('expires_at', [Carbon::today(), Carbon::today()->addDays(14)])
                ->count();

        return [
            'policies_current' => Policy::where('is_current', true)->count(),
            'contracts_pending' => $pending,
            'contracts_signed' => $signed,
            'contracts_expired' => $expired,
            'expiring_soon' => $expiringSoon,
            'compliance_percent' => $this->compliancePercent($user, $isEmployee),
        ];
    }

    public function overview(User $user): array
    {
        $this->expireStaleContracts();

        $policies = Policy::where('is_current', true)
            ->with('creator:id,name')
            ->orderByDesc('effective_date')
            ->get();

        $contractsQuery = Contract::with(['employee:id,name,email', 'signature'])
            ->orderByDesc('created_at');

        if ($user->role === UserRole::Employee) {
            $contractsQuery->where('employee_id', $user->id);
        }

        $contracts = $contractsQuery->get()->each(fn (Contract $c) => $c->refreshStatus());

        return [
            'stats' => $this->statsForDashboard($user),
            'policies' => $policies,
            'contracts' => $contracts,
            'expiring_soon' => $user->role === UserRole::Employee
                ? $this->expiringSoonForUser($user)
                : $this->expiringSoon(),
            'can_manage' => $user->hasAnyRole([UserRole::Admin->value, UserRole::Manager->value]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function complianceReport(): array
    {
        $this->expireStaleContracts();

        $employees = User::where('role', UserRole::Employee)->orderBy('name')->get(['id', 'name', 'email']);

        $contracts = Contract::with(['employee:id,name', 'signature'])->get();

        $signed = $contracts->where('status', ContractStatus::Signed);
        $pending = $contracts->where('status', ContractStatus::Pending);
        $expired = $contracts->where('status', ContractStatus::Expired);

        $unsignedEmployees = $employees->filter(function (User $emp) use ($pending) {
            return $pending->contains('employee_id', $emp->id);
        })->map(fn (User $emp) => [
            'id' => $emp->id,
            'name' => $emp->name,
            'email' => $emp->email,
            'pending_contracts' => $pending->where('employee_id', $emp->id)->count(),
        ])->values()->all();

        return [
            'summary' => [
                'total_contracts' => $contracts->count(),
                'signed' => $signed->count(),
                'pending' => $pending->count(),
                'expired' => $expired->count(),
                'current_policies' => Policy::where('is_current', true)->count(),
            ],
            'signed_contracts' => $signed->map(fn (Contract $c) => [
                'id' => $c->id,
                'title' => $c->title,
                'employee' => $c->employee?->name,
                'signed_at' => $c->signed_at?->toIso8601String(),
            ])->values()->all(),
            'unsigned_employees' => $unsignedEmployees,
            'expiring_soon' => collect($this->expiringSoon())->map(fn (Contract $c) => [
                'id' => $c->id,
                'title' => $c->title,
                'employee' => $c->employee?->name,
                'expires_at' => $c->expires_at?->format('Y-m-d'),
            ])->all(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function expiringSoonForUser(User $user): array
    {
        return collect($this->expiringSoon())
            ->filter(fn (Contract $c) => $c->employee_id === $user->id)
            ->map(fn (Contract $c) => [
                'id' => $c->id,
                'title' => $c->title,
                'expires_at' => $c->expires_at?->format('Y-m-d'),
            ])
            ->values()
            ->all();
    }

    private function compliancePercent(User $user, bool $isEmployee): int
    {
        if ($isEmployee) {
            $total = Contract::where('employee_id', $user->id)->count();
            if ($total === 0) {
                return 100;
            }
            $signed = Contract::where('employee_id', $user->id)
                ->where('status', ContractStatus::Signed)
                ->count();

            return (int) round(($signed / $total) * 100);
        }

        $employees = User::where('role', UserRole::Employee)->count();
        if ($employees === 0) {
            return 100;
        }

        $withPending = Contract::where('status', ContractStatus::Pending)
            ->distinct('employee_id')
            ->count('employee_id');

        $compliant = max(0, $employees - $withPending);

        return (int) round(($compliant / $employees) * 100);
    }
}
