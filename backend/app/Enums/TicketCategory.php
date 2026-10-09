<?php

namespace App\Enums;

enum TicketCategory: string
{
    case It = 'it';
    case Hr = 'hr';
    case Finance = 'finance';
    case Other = 'other';
}
