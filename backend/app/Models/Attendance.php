<?php

namespace App\Models;

use App\Enums\AttendanceStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'check_in_time',
        'check_out_time',
        'status',
        'working_minutes',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'check_in_time' => 'datetime',
            'check_out_time' => 'datetime',
            'status' => AttendanceStatus::class,
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function recalculateWorkingMinutes(): void
    {
        if ($this->check_in_time && $this->check_out_time) {
            $this->working_minutes = (int) $this->check_in_time->diffInMinutes($this->check_out_time);
        }
    }

    public function workingHours(): float
    {
        if ($this->working_minutes === null) {
            return 0;
        }

        return round($this->working_minutes / 60, 2);
    }

    public static function determineStatusOnCheckIn(Carbon $checkIn): AttendanceStatus
    {
        $lateThreshold = $checkIn->copy()->setTime(9, 0, 0);

        return $checkIn->greaterThan($lateThreshold)
            ? AttendanceStatus::Late
            : AttendanceStatus::Present;
    }
}
