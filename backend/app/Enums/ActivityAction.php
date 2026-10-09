<?php

namespace App\Enums;

enum ActivityAction: string
{
    case RequestSubmitted = 'request_submitted';
    case RequestApproved = 'request_approved';
    case RequestRejected = 'request_rejected';
    case EmployeeCreated = 'employee_created';
    case EmployeeUpdated = 'employee_updated';
    case EmployeeDeleted = 'employee_deleted';
    case DocumentUploaded = 'document_uploaded';
    case DocumentDeleted = 'document_deleted';
    case PayrollCreated = 'payroll_created';
    case PayrollUpdated = 'payroll_updated';
}
