<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{

    public function __construct(
        public string $token,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $resetUrl = $frontendUrl.'/reset-password?token='.urlencode($this->token)
            .'&email='.urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject(__('messages.auth.reset_mail_subject'))
            ->line(__('messages.auth.reset_mail_line'))
            ->action(__('messages.auth.reset_mail_action'), $resetUrl)
            ->line(__('messages.auth.reset_mail_expire'));
    }
}
