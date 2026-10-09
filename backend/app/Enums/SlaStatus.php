<?php

namespace App\Enums;

enum SlaStatus: string
{
    case OnTrack = 'on_track';
    case AtRisk = 'at_risk';
    case Breached = 'breached';
    case Met = 'met';
}
