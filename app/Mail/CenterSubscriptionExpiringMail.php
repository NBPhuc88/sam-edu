<?php

namespace App\Mail;

use App\Models\Center;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CenterSubscriptionExpiringMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public Center $center;

    public int $daysRemaining;

    /**
     * Create a new message instance.
     *
     * @param Center $center
     * @param int    $daysRemaining
     */
    public function __construct(Center $center, int $daysRemaining = 7)
    {
        $this->center        = $center;
        $this->daysRemaining = $daysRemaining;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[SAM Digital] Thông báo: Gói dịch vụ của Trung tâm '{$this->center->name}' sẽ hết hạn trong {$this->daysRemaining} ngày",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.center_subscription_expiring',
            with: [
                'center'        => $this->center,
                'daysRemaining' => $this->daysRemaining,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
