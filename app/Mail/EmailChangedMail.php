<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailChangedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    /**
     * @param string      $fullName
     * @param string      $username
     * @param string      $oldEmail
     * @param string      $newEmail
     * @param string      $roleLabel
     * @param string|null $centerName
     * @param string      $changedAt
     * @param string      $loginUrl
     */
    public function __construct(
        public string $fullName,
        public string $username,
        public string $oldEmail,
        public string $newEmail,
        public string $roleLabel = 'Tài khoản',
        public ?string $centerName = null,
        public string $changedAt = '',
        public string $loginUrl = ''
    ) {
        if (empty($this->changedAt)) {
            $this->changedAt = date('d/m/Y H:i:s');
        }

        if (empty($this->loginUrl)) {
            $this->loginUrl = url('/login');
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Sam Edu] Thông báo: Địa chỉ email {$this->roleLabel} đã được thay đổi",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.email_changed',
            with: [
                'fullName'   => $this->fullName,
                'username'   => $this->username,
                'oldEmail'   => $this->oldEmail,
                'newEmail'   => $this->newEmail,
                'roleLabel'  => $this->roleLabel,
                'centerName' => $this->centerName,
                'changedAt'  => $this->changedAt,
                'loginUrl'   => $this->loginUrl,
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
