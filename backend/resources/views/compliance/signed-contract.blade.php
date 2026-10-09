<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Signed Contract — {{ $contract->title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1e293b; margin: 40px; }
        h1 { font-size: 18px; color: #0f172a; border-bottom: 2px solid #334155; padding-bottom: 8px; }
        .meta { margin: 16px 0; }
        .meta dt { font-weight: bold; color: #475569; }
        .meta dd { margin: 0 0 8px 0; }
        .signature-block { margin-top: 32px; border: 1px solid #cbd5e1; padding: 16px; }
        .signature-block img { max-height: 80px; }
        .footer { margin-top: 40px; font-size: 10px; color: #64748b; }
    </style>
</head>
<body>
    <h1>{{ $contract->title }}</h1>

    @if($contract->description)
        <p>{{ $contract->description }}</p>
    @endif

    <dl class="meta">
        <dt>Employee</dt>
        <dd>{{ $employee->name }} ({{ $employee->email }})</dd>
        <dt>Contract reference</dt>
        <dd>#{{ $contract->id }}</dd>
        <dt>Signed at</dt>
        <dd>{{ $signedAt->format('Y-m-d H:i:s T') }}</dd>
        @if($ipAddress)
            <dt>IP address</dt>
            <dd>{{ $ipAddress }}</dd>
        @endif
        @if($contract->expires_at)
            <dt>Contract expiry</dt>
            <dd>{{ $contract->expires_at->format('Y-m-d') }}</dd>
        @endif
    </dl>

    <div class="signature-block">
        <p><strong>Digital signature</strong></p>
        <img src="data:image/png;base64,{{ $signatureBase64 }}" alt="Signature">
    </div>

    <p class="footer">
        This document was electronically signed via WorkSphere Compliance & Legal.
        Original file: {{ $contract->original_filename }}
    </p>
</body>
</html>
