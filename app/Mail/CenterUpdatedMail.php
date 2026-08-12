<?php

namespace App\Mail;

use App\Models\Center;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CenterUpdatedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public Center $center;
    public bool $isPasswordUpdated;
    public ?string $newPassword;

    /**
     * Create a new message instance.
     *
     * @param Center      $center
     * @param bool        $isPasswordUpdated
     * @param string|null $newPassword
     */
    public function __construct(Center $center, bool $isPasswordUpdated = false, ?string $newPassword = null)
    {
        $this->center            = $center;
        $this->isPasswordUpdated = $isPasswordUpdated;
        $this->newPassword       = $newPassword;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isPasswordUpdated
            ? "[Sam Edu] Thông báo: Mật khẩu & thông tin tài khoản Trung tâm '{$this->center->name}' đã được cập nhật"
            : "[Sam Edu] Thông báo: Thông tin tài khoản Trung tâm '{$this->center->name}' đã được cập nhật";

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.center_updated',
            with: [
                'center'            => $this->center,
                'isPasswordUpdated' => $this->isPasswordUpdated,
                'newPassword'       => $this->newPassword,
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
