<?php

namespace App\Services\Transcript;

use App\Models\Student;
use App\Repositories\Exam\ExamResultRepositoryInterface;
use App\Repositories\Student\StudentRepositoryInterface;
use Illuminate\Support\Facades\Auth;

class StudentTranscriptService implements StudentTranscriptServiceInterface
{
    public function __construct(
        protected StudentRepositoryInterface $studentRepository,
        protected ExamResultRepositoryInterface $examResultRepository
    ) {
    }

    /**
     * Resolve student model by authenticated student or given ID.
     *
     * @param  ?int     $studentId
     * @return ?Student
     */
    public function resolveStudent(?int $studentId = null): ?Student
    {
        /** @var Student|null $authStudent */
        $authStudent = Auth::guard('student')->user();

        if ($authStudent) {
            return $authStudent;
        }

        if ($studentId) {
            return $this->studentRepository->find($studentId);
        }

        return null;
    }

    /**
     * Get transcript print data for a student and optional class.
     *
     * @param  Student              $student
     * @param  ?int                 $classId
     * @return array<string, mixed>
     */
    public function getTranscriptPrintData(Student $student, ?int $classId = null): array
    {
        $student->load('center');
        $center = $student->center;

        // Danh sách các lớp học sinh đã/đang tham gia
        $enrolledClasses = $student->classes()
            ->select(['classes.id', 'classes.name', 'classes.code', 'classes.start_date', 'classes.end_date', 'classes.status'])
            ->get();

        $examResults = $this->examResultRepository->getTranscriptResults($student->id, $classId);

        $results = $examResults->map(function ($r) {
            return [
                'id'           => $r->id,
                'exam_name'    => $r->exam?->title ?? 'Bài kiểm tra',
                'subject_name' => $r->exam?->subject?->name ?? 'Môn học chung',
                'class_name'   => $r->classExam?->schoolClass?->name ?? 'Toàn trung tâm',
                'class_code'   => $r->classExam?->schoolClass?->code ?? '',
                'score'        => (float) $r->score,
                'grade'        => $r->grade ?: ($r->score >= 8.5 ? 'Xuất sắc' : ($r->score >= 7.0 ? 'Khá' : ($r->score >= 5.0 ? 'Trung bình' : 'Chưa đạt'))),
                'exam_date'    => $r->created_at ? $r->created_at->format('d/m/Y') : 'N/A',
                'note'         => $r->note ?? '',
            ];
        });

        // Tính điểm trung bình và xếp loại
        $totalScore = $results->sum('score');
        $count      = $results->count();
        $gpa        = $count > 0 ? round($totalScore / $count, 2) : 0;

        $academicRanking = 'Chưa xếp loại';

        if ($count > 0) {
            if ($gpa >= 9.0) {
                $academicRanking = 'Xuất Sắc';
            } elseif ($gpa >= 8.0) {
                $academicRanking = 'Giỏi';
            } elseif ($gpa >= 6.5) {
                $academicRanking = 'Khá';
            } elseif ($gpa >= 5.0) {
                $academicRanking = 'Trung Bình';
            } else {
                $academicRanking = 'Yếu';
            }
        }

        $highestScore = $count > 0 ? $results->max('score') : 0;
        $lowestScore  = $count > 0 ? $results->min('score') : 0;
        $passCount    = $results->where('score', '>=', 5.0)->count();
        $passRate     = $count > 0 ? round(($passCount / $count) * 100, 1) : 0;

        return [
            'student'         => $student,
            'center'          => $center,
            'enrolledClasses' => $enrolledClasses,
            'selectedClassId' => $classId,
            'results'         => $results,
            'gpa'             => $gpa,
            'academicRanking' => $academicRanking,
            'highestScore'    => $highestScore,
            'lowestScore'     => $lowestScore,
            'passRate'        => $passRate,
            'summary'         => [
                'totalExams'      => $count,
                'gpa'             => $gpa,
                'academicRanking' => $academicRanking,
                'highestScore'    => $highestScore,
                'lowestScore'     => $lowestScore,
                'passRate'        => $passRate,
            ],
            'printDate' => now()->format('d/m/Y H:i'),
        ];
    }
}
