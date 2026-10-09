<?php

namespace App\Http\Requests\Application;

use App\Enums\JobStatus;
use App\Models\Job;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_id' => [
                'required',
                'integer',
                Rule::exists('job_postings', 'id')->where('status', JobStatus::Open->value),
            ],
            'candidate_name' => ['required', 'string', 'max:255'],
            'candidate_email' => ['required', 'email', 'max:255'],
            'resume' => [
                'required',
                'file',
                'max:10240',
                'mimes:pdf,doc,docx',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user('api');
            if ($user && strcasecmp($this->input('candidate_email'), $user->email) !== 0) {
                $validator->errors()->add(
                    'candidate_email',
                    __('messages.applications.email_must_match'),
                );
            }

            $jobId = $this->integer('job_id');
            if ($user && $jobId) {
                $exists = Job::query()
                    ->whereKey($jobId)
                    ->whereHas('applications', function ($q) use ($user) {
                        $q->where('user_id', $user->id)
                            ->orWhere('candidate_email', $user->email);
                    })
                    ->exists();

                if ($exists) {
                    $validator->errors()->add('job_id', __('messages.applications.already_applied'));
                }
            }
        });
    }
}
