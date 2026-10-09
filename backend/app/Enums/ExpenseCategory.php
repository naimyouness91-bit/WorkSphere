<?php

namespace App\Enums;

enum ExpenseCategory: string
{
    case Hr = 'hr';
    case It = 'it';
    case Operations = 'operations';
    case Other = 'other';
}
