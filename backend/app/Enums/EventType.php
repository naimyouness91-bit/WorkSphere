<?php

namespace App\Enums;

enum EventType: string
{
    case Leave = 'leave';
    case Meeting = 'meeting';
    case Vehicle = 'vehicle';
}
