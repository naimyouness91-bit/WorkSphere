<?php

namespace App\Enums;

enum TrainingStatus: string
{
    case Scheduled = 'scheduled';
    case Completed = 'completed';
}
