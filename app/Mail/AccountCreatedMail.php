<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountCreatedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    /**
     * @param string      $fullName
     * @param string      $username
     * @param string      $roleLabel
     * @param string      $userCode
     * @param string|null $rawPassword
     * @param string|null $centerName
     * @param string      $loginUrl
     */
    public function __construct(
        public string $fullName,
        public string $username,
        public string $roleLabel,
        public string $userCode,
        public ?string $rawPassword = null,
        public ?string $centerName = null,
        public string $loginUrl = ''
    ) {
        if (empty($this->loginUrl)) {
            $this->loginUrl = url('/login');
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $centerPrefix = $this->centerName ? " tại {$this->centerName}" : '';

        return new Envelope(
            subject: "[Sam Edu] Thông tin tài khoản {$this->roleLabel} mới{$centerPrefix}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.account_created',
            with: [
                'fullName'    => $this->fullName,
                'username'    => $this->username,
                'roleLabel'   => $this->roleLabel,
                'userCode'    => $this->userCode,
                'rawPassword' => $this->rawPassword,
                'centerName'  => $this->centerName,
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
