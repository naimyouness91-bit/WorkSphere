<?php

namespace App\Enums;

enum LeaveType: string
{
    case Sick = 'sick';
    case Vacation = 'vacation';
    case Unpaid = 'unpaid';
}
