<?php

namespace App\Mail;

use App\Models\ClassExam;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClassExamCreatedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    /**
     * @param ClassExam $classExam
     * @param string    $recipientName
     * @param string    $recipientRole 'student' | 'teacher' | 'admin'
     * @param string    $examRoomUrl
     * @param string    $enterCodeUrl
     */
    public function __construct(
        public ClassExam $classExam,
        public string $recipientName,
        public string $recipientRole = 'student',
        public string $examRoomUrl = '',
        public string $enterCodeUrl = ''
    ) {
        if (empty($this->examRoomUrl)) {
            $this->examRoomUrl = url("/class-exams/{$this->classExam->id}/room");
        }

        if (empty($this->enterCodeUrl)) {
            $this->enterCodeUrl = url('/exam-room');
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $className = $this->classExam->schoolClass?->name ?? 'Lớp học';
        $prefix    = $this->recipientRole === 'teacher' ? 'Lịch thi mới' : 'Thông báo Kỳ thi';

        return new Envelope(
            subject: "[SAM Digital] {$prefix}: {$this->classExam->title} - Lớp {$className}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.class_exam_created',
            with: [
                'classExam'     => $this->classExam,
                'recipientName' => $this->recipientName,
                'recipientRole' => $this->recipientRole,
                'examRoomUrl'   => $this->examRoomUrl,
                'enterCodeUrl'  => $this->enterCodeUrl,
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
