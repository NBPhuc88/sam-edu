<?php

namespace App\Mail;

use App\Models\Center;
use App\Models\CenterSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CenterSubscriptionRenewedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public Center $center;
    public CenterSubscription $subscription;
    public string $actionType; // 'renew' | 'change'

    /**
     * Create a new message instance.
     *
     * @param Center             $center
     * @param CenterSubscription $subscription
     * @param string             $actionType
     */
    public function __construct(Center $center, CenterSubscription $subscription, string $actionType = 'renew')
    {
        $this->center       = $center;
        $this->subscription = $subscription;
        $this->actionType   = $actionType;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $actionTitle = $this->actionType === 'change' ? 'Đổi gói cước' : 'Gia hạn gói cước';

        return new Envelope(
            subject: "[SAM Digital] Thông báo: {$actionTitle} thành công cho Trung tâm '{$this->center->name}'",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.center_subscription_renewed',
            with: [
                'center'       => $this->center,
                'subscription' => $this->subscription,
                'actionType'   => $this->actionType,
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
