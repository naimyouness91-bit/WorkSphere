<?php

namespace App\Services\Integrations;

use App\Enums\IntegrationService;
use App\Models\Integration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CloudStorageIntegrationService
{
    public function __construct(
        private IntegrationLogWriter $logger,
    ) {}

    public function upload(Integration $integration, UploadedFile $file, ?string $remotePath = null): array
    {
        $remotePath = $remotePath ?? 'worksphere/'.$file->getClientOriginalName();

        return match ($integration->service_name) {
            IntegrationService::GoogleDrive => $this->uploadGoogleDrive($integration, $file, $remotePath),
            IntegrationService::Dropbox => $this->uploadDropbox($integration, $file, $remotePath),
            default => throw new \InvalidArgumentException('Unsupported cloud storage service.'),
        };
    }

    public function download(Integration $integration, string $remotePath): string
    {
        return match ($integration->service_name) {
            IntegrationService::GoogleDrive => $this->downloadGoogleDrive($integration, $remotePath),
            IntegrationService::Dropbox => $this->downloadDropbox($integration, $remotePath),
            default => throw new \InvalidArgumentException('Unsupported cloud storage service.'),
        };
    }

    public function test(Integration $integration): void
    {
        if (! $integration->api_key) {
            throw new \InvalidArgumentException('API key or access token is required.');
        }

        $serviceLabel = $integration->service_name === IntegrationService::GoogleDrive
            ? 'Google Drive'
            : 'Dropbox';

        $this->logger->log(
            $integration,
            'test',
            "{$serviceLabel} credentials validated successfully.",
            'success',
            ['token_length' => strlen($integration->api_key)],
        );
    }

    private function uploadGoogleDrive(Integration $integration, UploadedFile $file, string $remotePath): array
    {
        $token = $integration->api_key;
        $folderId = $integration->settings['folder_id'] ?? null;

        $metadata = ['name' => basename($remotePath)];
        if ($folderId) {
            $metadata['parents'] = [$folderId];
        }

        $response = Http::withToken($token)
            ->timeout(60)
            ->attach('metadata', json_encode($metadata), 'metadata.json')
            ->attach('file', $file->get(), $file->getClientOriginalName())
            ->post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');

        if (! $response->successful()) {
            $this->logger->log(
                $integration,
                'upload_failed',
                'Google Drive upload failed: '.$response->body(),
                'failed',
            );

            throw new \RuntimeException('Google Drive upload failed.');
        }

        $fileId = $response->json('id');

        $this->logger->log(
            $integration,
            'file_uploaded',
            'File uploaded to Google Drive: '.$file->getClientOriginalName(),
            'success',
            ['file_id' => $fileId, 'path' => $remotePath],
        );

        return ['file_id' => $fileId, 'path' => $remotePath];
    }

    private function uploadDropbox(Integration $integration, UploadedFile $file, string $remotePath): array
    {
        $token = $integration->api_key;
        $dropboxPath = '/'.ltrim($remotePath, '/');

        $response = Http::withToken($token)
            ->withHeaders([
                'Content-Type' => 'application/octet-stream',
                'Dropbox-API-Arg' => json_encode([
                    'path' => $dropboxPath,
                    'mode' => 'add',
                    'autorename' => true,
                ]),
            ])
            ->timeout(60)
            ->withBody($file->get(), 'application/octet-stream')
            ->post('https://content.dropboxapi.com/2/files/upload');

        if (! $response->successful()) {
            $this->logger->log(
                $integration,
                'upload_failed',
                'Dropbox upload failed: '.$response->body(),
                'failed',
            );

            throw new \RuntimeException('Dropbox upload failed.');
        }

        $this->logger->log(
            $integration,
            'file_uploaded',
            'File uploaded to Dropbox: '.$file->getClientOriginalName(),
            'success',
            ['path' => $dropboxPath],
        );

        return ['path' => $dropboxPath];
    }

    private function downloadGoogleDrive(Integration $integration, string $fileId): string
    {
        $response = Http::withToken($integration->api_key)
            ->timeout(60)
            ->get("https://www.googleapis.com/drive/v3/files/{$fileId}?alt=media");

        if (! $response->successful()) {
            throw new \RuntimeException('Google Drive download failed.');
        }

        $localName = 'integrations/'.Str::uuid().'.bin';
        Storage::disk('local')->put($localName, $response->body());

        $this->logger->log(
            $integration,
            'file_downloaded',
            'File downloaded from Google Drive',
            'success',
            ['file_id' => $fileId],
        );

        return Storage::disk('local')->path($localName);
    }

    private function downloadDropbox(Integration $integration, string $remotePath): string
    {
        $dropboxPath = '/'.ltrim($remotePath, '/');

        $response = Http::withToken($integration->api_key)
            ->withHeaders([
                'Dropbox-API-Arg' => json_encode(['path' => $dropboxPath]),
            ])
            ->timeout(60)
            ->post('https://content.dropboxapi.com/2/files/download');

        if (! $response->successful()) {
            throw new \RuntimeException('Dropbox download failed.');
        }

        $localName = 'integrations/'.Str::uuid().'.bin';
        Storage::disk('local')->put($localName, $response->body());

        $this->logger->log(
            $integration,
            'file_downloaded',
            'File downloaded from Dropbox: '.$dropboxPath,
        );

        return Storage::disk('local')->path($localName);
    }
}
