<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public string $accountName;

    public string $otp;

    public string $accountType;

    /**
     * Create a new message instance.
     *
     * @param string $accountName
     * @param string $otp
     * @param string $accountType
     */
    public function __construct(string $accountName, string $otp, string $accountType)
    {
        $this->accountName = $accountName;
        $this->otp         = $otp;
        $this->accountType = $accountType;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $roleLabel = match ($this->accountType) {
            'admin'   => 'Quản trị viên',
            'teacher' => 'Giáo viên',
            'student' => 'Học sinh',
            default   => 'Tài khoản',
        };

        return new Envelope(
            subject: "[SAM Digital] Mã OTP đặt lại mật khẩu của bạn là: {$this->otp}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.password_reset_otp',
            with: [
                'accountName' => $this->accountName,
                'otp'         => $this->otp,
                'accountType' => $this->accountType,
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
