<?php

namespace App\Enums;

enum IntegrationService: string
{
    case Slack = 'slack';
    case Teams = 'teams';
    case Email = 'email';
    case GoogleDrive = 'google_drive';
    case Dropbox = 'dropbox';
    case GoogleCalendar = 'google_calendar';
}
