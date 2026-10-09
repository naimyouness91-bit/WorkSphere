<?php

namespace App\Enums;

enum BudgetStatus: string
{
    case Active = 'active';
    case Exceeded = 'exceeded';
    case Closed = 'closed';
}
