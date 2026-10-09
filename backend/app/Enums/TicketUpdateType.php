<?php

namespace App\Enums;

enum TicketUpdateType: string
{
    case Created = 'created';
    case Comment = 'comment';
    case StatusChange = 'status_change';
    case Assignment = 'assignment';
    case Escalation = 'escalation';
}
