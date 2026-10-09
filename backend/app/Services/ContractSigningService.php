<?php

namespace App\Services;

use App\Enums\ContractStatus;
use App\Models\Contract;
use App\Models\Signature;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContractSigningService
{
    public function __construct(
        private AuditLogger $auditLogger,
    ) {}

    public function sign(Contract $contract, User $user, string $signatureData, Request $request): Contract
    {
        $contract->refreshStatus();

        if ($contract->status !== ContractStatus::Pending) {
            throw new \InvalidArgumentException(__('messages.compliance.contract_not_pending'));
        }

        if (! $contract->isOwnedBy($user)) {
            throw new \InvalidArgumentException(__('messages.compliance.contract_forbidden'));
        }

        $pngPath = $this->storeSignatureImage($contract, $signatureData);

        $signature = Signature::create([
            'user_id' => $user->id,
            'contract_id' => $contract->id,
            'signature_file_path' => $pngPath,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit($request->userAgent() ?? '', 500),
            'signed_at' => now(),
        ]);

        $signedPdfPath = $this->generateSignedPdf($contract, $user, $signature);

        $contract->update([
            'status' => ContractStatus::Signed,
            'signed_at' => now(),
            'signed_contract_path' => $signedPdfPath,
        ]);

        $this->auditLogger->log(
            $user,
            'contract_signed',
            'compliance',
            __('messages.compliance.audit_contract_signed', [
                'title' => $contract->title,
                'employee' => $user->name,
            ]),
            $request,
        );

        return $contract->fresh(['employee', 'signature', 'publisher']);
    }

    private function storeSignatureImage(Contract $contract, string $signatureData): string
    {
        if (! preg_match('/^data:image\/(png|jpeg);base64,/', $signatureData)) {
            throw new \InvalidArgumentException(__('messages.compliance.invalid_signature'));
        }

        $raw = base64_decode(preg_replace('/^data:image\/\w+;base64,/', '', $signatureData), true);
        if ($raw === false || strlen($raw) < 100) {
            throw new \InvalidArgumentException(__('messages.compliance.invalid_signature'));
        }

        $path = 'compliance/signatures/contract_'.$contract->id.'_'.now()->format('YmdHis').'.png';
        Storage::disk('local')->put($path, $raw);

        return $path;
    }

    private function generateSignedPdf(Contract $contract, User $user, Signature $signature): string
    {
        $signatureBase64 = base64_encode(
            Storage::disk('local')->get($signature->signature_file_path),
        );

        $pdf = Pdf::loadView('compliance.signed-contract', [
            'contract' => $contract,
            'employee' => $user,
            'signatureBase64' => $signatureBase64,
            'signedAt' => $signature->signed_at,
            'ipAddress' => $signature->ip_address,
        ])->setPaper('a4');

        $path = 'compliance/signed/contract_'.$contract->id.'_signed.pdf';
        Storage::disk('local')->put($path, $pdf->output());

        return $path;
    }
}
