<?php

namespace App\Mail;

use App\Models\Center;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewCenterRegisteredMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public Center $center;

    /**
     * Create a new message instance.
     * @param Center $center
     */
    public function __construct(Center $center)
    {
        $this->center = $center;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[SAM Digital] Thông báo: Trung tâm mới '{$this->center->name}' vừa đăng ký!",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.new_center_registered',
            with: [
                'center' => $this->center,
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
