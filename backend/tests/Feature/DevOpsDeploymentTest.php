<?php

namespace Tests\Feature;

use App\Enums\Locale;
use App\Models\Deployment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class DevOpsDeploymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_ci_can_record_successful_deployment_with_webhook_secret(): void
    {
        config(['services.deploy_webhook_secret' => 'test-deploy-secret']);

        $response = $this->postJson('/api/devops/deployments', [
            'environment' => 'staging',
            'status' => 'success',
            'version' => '1.0.0-ci',
            'image_tag' => 'worksphere/staging:1.0.0-ci',
        ], ['X-Deploy-Secret' => 'test-deploy-secret']);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'success');

        $this->assertDatabaseHas('deployments', [
            'environment' => 'staging',
            'version' => '1.0.0-ci',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_rollback_failed_deployment(): void
    {
        $admin = User::factory()->admin()->create(['locale' => Locale::English]);

        $earlier = now()->subHours(2);
        $later = now()->subHour();

        $good = Deployment::create([
            'environment' => 'production',
            'version' => '1.0.0',
            'status' => 'success',
            'is_active' => false,
            'started_at' => $earlier,
            'finished_at' => $earlier,
            'created_at' => $earlier,
            'updated_at' => $earlier,
        ]);

        $bad = Deployment::create([
            'environment' => 'production',
            'version' => '1.0.1',
            'status' => 'failed',
            'is_active' => false,
            'started_at' => $later,
            'finished_at' => $later,
            'created_at' => $later,
            'updated_at' => $later,
        ]);

        $token = JWTAuth::fromUser($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/devops/deployments/{$bad->id}/rollback");

        $response->assertOk()
            ->assertJsonPath('data.restored_version', '1.0.0');

        $this->assertDatabaseHas('deployments', [
            'id' => $good->id,
            'is_active' => true,
        ]);
    }
}
