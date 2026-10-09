<?php

namespace Tests\Feature;

use App\Enums\Locale;
use App\Models\Deployment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class DevOpsDeploymentSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create(['locale' => Locale::English]);
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }

    private function failedDeployment(string $version = '1.0.1'): Deployment
    {
        return Deployment::create([
            'environment' => 'production',
            'version' => $version,
            'status' => 'failed',
            'is_active' => false,
            'started_at' => now(),
            'finished_at' => now(),
        ]);
    }

    public function test_rollback_requires_authentication(): void
    {
        $deployment = $this->failedDeployment();

        $response = $this->postJson("/api/devops/deployments/{$deployment->id}/rollback");

        $response->assertUnauthorized();
    }

    public function test_rollback_forbidden_for_non_admin(): void
    {
        $manager = User::factory()->manager()->create();
        $deployment = $this->failedDeployment();

        $response = $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($manager))
            ->postJson("/api/devops/deployments/{$deployment->id}/rollback");

        $response->assertForbidden()
            ->assertJsonPath('message', __('messages.roles.forbidden'));
    }

    public function test_webhook_deployment_forbidden_without_secret_or_admin(): void
    {
        config(['services.deploy_webhook_secret' => null]);

        $response = $this->postJson('/api/devops/deployments', [
            'environment' => 'staging',
            'status' => 'success',
            'version' => '1.0.0',
        ]);

        $response->assertForbidden()
            ->assertJsonPath('message', __('messages.devops.forbidden'));
    }

    public function test_webhook_deployment_forbidden_with_invalid_secret(): void
    {
        config(['services.deploy_webhook_secret' => 'correct-deploy-secret']);

        $response = $this->postJson('/api/devops/deployments', [
            'environment' => 'staging',
            'status' => 'success',
            'version' => '1.0.0',
        ], ['X-Deploy-Secret' => 'wrong-deploy-secret']);

        $response->assertForbidden()
            ->assertJsonPath('message', __('messages.devops.forbidden'));
    }

    public function test_record_deployment_validates_environment_and_status(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($this->admin()))
            ->postJson('/api/devops/deployments', [
                'environment' => 'not-an-environment',
                'status' => 'not-a-status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['environment', 'status']);
    }

    public function test_rollback_without_previous_success_returns_validation_error(): void
    {
        $deployment = $this->failedDeployment();

        $response = $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($this->admin()))
            ->postJson("/api/devops/deployments/{$deployment->id}/rollback");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['deployment'])
            ->assertJsonPath('errors.deployment.0', __('messages.devops.no_rollback_target'));
    }

    public function test_rollback_marks_failed_and_records_rollback_link(): void
    {
        $good = Deployment::create([
            'environment' => 'production',
            'version' => '1.0.0',
            'status' => 'success',
            'is_active' => true,
            'started_at' => now()->subHour(),
            'finished_at' => now()->subHour(),
        ]);

        $bad = $this->failedDeployment('1.0.1');

        $response = $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($this->admin()))
            ->postJson("/api/devops/deployments/{$bad->id}/rollback");

        $response->assertOk()
            ->assertJsonPath('data.restored_version', '1.0.0');

        $this->assertDatabaseHas('deployments', [
            'id' => $bad->id,
            'status' => 'rolled_back',
        ]);

        $this->assertDatabaseHas('deployments', [
            'rollback_from_id' => $bad->id,
            'version' => '1.0.0',
            'status' => 'success',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('deployments', [
            'id' => $good->id,
            'is_active' => true,
        ]);
    }
}
