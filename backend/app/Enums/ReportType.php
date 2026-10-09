<?php

namespace App\Enums;

enum ReportType: string
{
    case Requests = 'requests';
    case Payroll = 'payroll';
    case Attendance = 'attendance';
    case Finance = 'finance';
    case Performance = 'performance';
    case Hr = 'hr';
}
