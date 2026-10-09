<?php

namespace App\Enums;

enum NotificationCategory: string
{
    case Request = 'request';
    case Payroll = 'payroll';
    case Training = 'training';
    case Gamification = 'gamification';
    case Compliance = 'compliance';
    case Asset = 'asset';
    case Project = 'project';
    case Knowledge = 'knowledge';
    case Performance = 'performance';
    case Recruitment = 'recruitment';
    case Crm = 'crm';
    case Helpdesk = 'helpdesk';
    case Inventory = 'inventory';
    case Finance = 'finance';
    case System = 'system';
    case Customization = 'customization';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
