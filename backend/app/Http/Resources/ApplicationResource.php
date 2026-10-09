<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'job_id' => $this->job_id,
            'user_id' => $this->user_id,
            'candidate_name' => $this->candidate_name,
            'candidate_email' => $this->candidate_email,
            'resume_path' => $this->resume_path,
            'original_resume_filename' => $this->original_resume_filename,
            'status' => $this->status->value,
            'job' => $this->whenLoaded('job', fn () => [
                'id' => $this->job->id,
                'title' => $this->job->title,
                'department' => $this->job->department,
                'location' => $this->job->location,
                'status' => $this->job->status->value,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
