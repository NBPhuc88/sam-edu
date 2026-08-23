<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountVerificationOtpMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    /**
     * @param string $name
     * @param string $otp
     * @param string $actionLabel
     * @param int    $expiresInMinutes
     */
    public function __construct(
        public string $name,
        public string $otp,
        public string $actionLabel = 'Xác thực tài khoản',
        public int $expiresInMinutes = 5
    ) {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Sam Edu] Mã xác thực OTP ({$this->otp}) cho {$this->actionLabel}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.account_verification_otp',
            with: [
                'name'             => $this->name,
                'otp'              => $this->otp,
                'actionLabel'      => $this->actionLabel,
                'expiresInMinutes' => $this->expiresInMinutes,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
