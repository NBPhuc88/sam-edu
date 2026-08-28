<?php

namespace App\Mail;

use App\Models\Admin;
use App\Models\Center;
use App\Models\SubscriptionPlan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CenterSubscriptionRenewalRequestedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    /**
     * Create a new message instance.
     * @param Center           $center
     * @param SubscriptionPlan $plan
     * @param ?string          $note
     * @param ?Admin           $requestingUser
     */
    public function __construct(
        public Center $center,
        public SubscriptionPlan $plan,
        public ?string $note = null,
        public ?Admin $requestingUser = null
    ) {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[SAM Digital] Yêu cầu gia hạn gói dịch vụ từ Trung tâm '{$this->center->name}'",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.center_subscription_renewal_requested',
            with: [
                'center'         => $this->center,
                'plan'           => $this->plan,
                'note'           => $this->note,
                'requestingUser' => $this->requestingUser,
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
