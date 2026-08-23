<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UsernameChangedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    /**
     * @param string      $fullName
     * @param string      $oldUsername
     * @param string      $newUsername
     * @param string      $roleLabel
     * @param string|null $centerName
     * @param string|null $changedAt
     * @param string|null $loginUrl
     */
    public function __construct(
        public string $fullName,
        public string $oldUsername,
        public string $newUsername,
        public string $roleLabel = 'Tài khoản',
        public ?string $centerName = null,
        public ?string $changedAt = null,
        public ?string $loginUrl = null
    ) {
        $this->changedAt = $this->changedAt ?? date('d/m/Y H:i:s');
        $this->loginUrl  = $this->loginUrl ?? url('/login');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Sam Edu] Thông báo: Tên đăng nhập ({$this->newUsername}) của bạn đã được thay đổi",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.username_changed',
            with: [
                'fullName'    => $this->fullName,
                'oldUsername' => $this->oldUsername,
                'newUsername' => $this->newUsername,
                'roleLabel'   => $this->roleLabel,
                'centerName'  => $this->centerName,
                'changedAt'   => $this->changedAt,
                'loginUrl'    => $this->loginUrl,
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
