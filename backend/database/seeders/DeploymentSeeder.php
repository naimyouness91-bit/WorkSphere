<?php

namespace Database\Seeders;

use App\Models\Deployment;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DeploymentSeeder extends Seeder
{
    public function run(): void
    {
        $versions = ['1.0.0', '1.0.1', '1.1.0', '1.1.1', '1.2.0'];

        foreach (['staging', 'production'] as $env) {
            foreach ($versions as $i => $version) {
                $status = $i === 2 && $env === 'production' ? 'failed' : 'success';
                Deployment::create([
                    'environment' => $env,
                    'version' => $version,
                    'status' => $status,
                    'image_tag' => "worksphere/{$env}:{$version}",
                    'commit_sha' => substr(md5($version.$env), 0, 7),
                    'triggered_by' => 'ci',
                    'is_active' => $status === 'success' && $i === count($versions) - 1,
                    'started_at' => Carbon::now()->subDays(count($versions) - $i),
                    'finished_at' => Carbon::now()->subDays(count($versions) - $i)->addMinutes(4),
                ]);
            }
        }
    }
}
