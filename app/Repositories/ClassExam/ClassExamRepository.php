<?php

namespace App\Repositories\ClassExam;

use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClassExamRepository implements ClassExamRepositoryInterface
{
    public function getPaginatedClassExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $examId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null,
        ?Teacher $teacher = null
    ): LengthAwarePaginator {
        $query = ClassExam::query()
            ->select(
                'id',
                'class_id',
                'exam_id',
                'created_by_teacher_id',
                'created_by_admin_id',
                'title',
                'exam_date',
                'start_time',
                'end_time',
                'duration_minutes',
                'max_score',
                'status',
                'created_at'
            )
            ->with([
                'schoolClass:id,center_id,name,code',
                'schoolClass.center:id,name,code',
                'exam:id,subject_id,name,code',
                'exam.subject:id,name,code',
                'createdByTeacher:id,full_name,teacher_code',
                'createdByAdmin:id,full_name,admin_code',
            ]);

        // Scope by teacher or admin center
        if ($teacher) {
            $query->where('created_by_teacher_id', $teacher->id);
        } elseif ($admin && ! $admin->isSuperAdmin()) {
            $managedCenterIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereHas('schoolClass', function ($q) use ($managedCenterIds) {
                $q->whereIn('center_id', $managedCenterIds);
            });
        } elseif ($centerId) {
            $query->whereHas('schoolClass', function ($q) use ($centerId) {
                $q->where('center_id', $centerId);
            });
        }

        if ($classId) {
            $query->where('class_id', $classId);
        }

        if ($examId) {
            $query->where('exam_id', $examId);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('schoolClass', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('exam', function ($eq) use ($search) {
                        $eq->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        return $query->orderBy('exam_date', 'desc')
            ->orderBy('start_time', 'asc')
            ->deferredPaginate($perPage, ['*'], 'page', $page);
    }

    public function findById(int $id, ?Admin $admin = null, ?Teacher $teacher = null): ?ClassExam
    {
        $query = ClassExam::query()
            ->select(
                'id',
                'class_id',
                'exam_id',
                'created_by_teacher_id',
                'created_by_admin_id',
                'title',
                'exam_date',
                'start_time',
                'end_time',
                'duration_minutes',
                'max_score',
                'status',
                'note',
                'created_at'
            )
            ->with([
                'schoolClass:id,center_id,name,code',
                'schoolClass.center:id,name,code',
                'exam:id,subject_id,name,code',
                'exam.subject:id,name,code',
                'exam.sections:id,exam_id,title,description,skill,order_index',
                'exam.sections.questions:id,exam_id,section_id,code,title,question_type,skill,content,image_url,audio_url,score,options,correct_answer,explanation,metadata,order_index',
                'createdByTeacher:id,full_name,teacher_code',
                'createdByAdmin:id,full_name,admin_code',
            ]);

        if ($teacher) {
            $query->where('created_by_teacher_id', $teacher->id);
        } elseif ($admin && ! $admin->isSuperAdmin()) {
            $managedCenterIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereHas('schoolClass', function ($q) use ($managedCenterIds) {
                $q->whereIn('center_id', $managedCenterIds);
            });
        }

        return $query->find($id);
    }

    public function create(array $data): ClassExam
    {
        return ClassExam::create($data);
    }

    public function update(ClassExam $classExam, array $data): ClassExam
    {
        $classExam->update($data);

        return $classExam->fresh(['schoolClass.center', 'exam.subject']);
    }

    public function delete(ClassExam $classExam): bool
    {
        return (bool) $classExam->delete();
    }

    public function getStats(?Admin $admin = null, ?Teacher $teacher = null): array
    {
        $query = ClassExam::query();

        if ($teacher) {
            $query->where('created_by_teacher_id', $teacher->id);
        } elseif ($admin && ! $admin->isSuperAdmin()) {
            $managedCenterIds = $admin->centers()
            ->pluck('centers.id')
            ->toArray();
            $query->whereHas('schoolClass', function ($q) use ($managedCenterIds) {
                $q->whereIn('center_id', $managedCenterIds);
            });
        }

        $total     = (clone $query)->count();
        $scheduled = (clone $query)->where('status', 'scheduled')->count();
        $ongoing   = (clone $query)->where('status', 'ongoing')->count();
        $completed = (clone $query)->where('status', 'completed')->count();

        return [
            'total'     => $total,
            'scheduled' => $scheduled,
            'ongoing'   => $ongoing,
            'completed' => $completed,
        ];
    }

    public function findByCodeOrAccessCode(string $code): ?ClassExam
    {
        $cleanedCode = trim($code);

        return ClassExam::query()
            ->select('id', 'code', 'access_code', 'class_id', 'exam_id', 'title', 'exam_date', 'start_time', 'end_time', 'valid_from', 'valid_to', 'duration_minutes', 'max_score', 'pass_score', 'status', 'created_by_teacher_id', 'created_by_admin_id', 'created_at')
            ->with([
                'schoolClass:id,center_id,name,code',
                'schoolClass.students:id,student_code,full_name,email,phone',
                'schoolClass.center:id,name,code',
                'exam:id,subject_id,name,code,duration_minutes,max_score,pass_score',
                'exam.subject:id,name,code',
                'exam.sections:id,exam_id,title,description,skill,order_index',
                'exam.sections.questions:id,exam_id,section_id,code,title,question_type,skill,content,image_url,audio_url,score,options,correct_answer,explanation,metadata,order_index',
            ])
            ->where(function ($q) use ($cleanedCode) {
                $q->where('code', $cleanedCode)
                    ->orWhere('access_code', $cleanedCode);
            })
            ->first();
    }

    public function findWithFullExam(int $classExamId): ?ClassExam
    {
        return ClassExam::query()
            ->select('id', 'code', 'access_code', 'class_id', 'exam_id', 'title', 'exam_date', 'start_time', 'end_time', 'valid_from', 'valid_to', 'duration_minutes', 'max_score', 'pass_score', 'status', 'created_by_teacher_id', 'created_by_admin_id', 'created_at')
            ->with([
                'schoolClass:id,center_id,name,code',
                'schoolClass.center:id,name,code',
                'exam:id,subject_id,name,code,duration_minutes,max_score,pass_score',
                'exam.subject:id,name,code',
                'exam.sections:id,exam_id,title,description,skill,order_index',
                'exam.sections.questions:id,exam_id,section_id,code,title,question_type,skill,content,image_url,audio_url,score,options,correct_answer,explanation,metadata,order_index',
            ])
            ->find($classExamId);
    }

    public function findClassExamById(int $classExamId): ?ClassExam
    {
        return ClassExam::select('id', 'code', 'access_code', 'class_id', 'exam_id', 'title', 'exam_date', 'start_time', 'end_time', 'valid_from', 'valid_to', 'duration_minutes', 'max_score', 'pass_score', 'status')->find($classExamId);
    }

    public function getNextClassExamCode(): string
    {
        $maxId = (int) (ClassExam::max('id') ?? 0);

        return sprintf('CE%09d', $maxId + 1);
    }

    public function getStudentSubmission(int $classExamId, int $studentId): ?\App\Models\ClassExamSubmission
    {
        return \App\Models\ClassExamSubmission::query()
            ->select('id', 'class_exam_id', 'student_id', 'attempt_number', 'started_at', 'submitted_at', 'duration_seconds_used', 'score', 'total_correct', 'total_questions', 'status', 'answers', 'grading_details')
            ->where('class_exam_id', $classExamId)
            ->where('student_id', $studentId)
            ->orderBy('attempt_number', 'desc')
            ->first();
    }

    public function createSubmission(array $data): \App\Models\ClassExamSubmission
    {
        return \App\Models\ClassExamSubmission::create($data);
    }

    public function updateSubmission(\App\Models\ClassExamSubmission $submission, array $data): \App\Models\ClassExamSubmission
    {
        $submission->update($data);

        return $submission;
    }

    public function findSubmissionWithDetails(int $submissionId): ?\App\Models\ClassExamSubmission
    {
        return \App\Models\ClassExamSubmission::query()
            ->select('id', 'class_exam_id', 'student_id', 'attempt_number', 'started_at', 'submitted_at', 'duration_seconds_used', 'score', 'total_correct', 'total_questions', 'status', 'answers', 'grading_details')
            ->with([
                'student:id,student_code,full_name,email,phone',
                'classExam:id,class_id,exam_id,title,exam_date,start_time,end_time,duration_minutes,max_score,pass_score,status',
                'classExam.schoolClass:id,center_id,name,code',
                'classExam.schoolClass.center:id,name,code',
                'classExam.exam:id,subject_id,name,code',
                'classExam.exam.subject:id,name,code',
                'classExam.exam.sections:id,exam_id,title,description,skill,order_index',
                'classExam.exam.sections.questions:id,exam_id,section_id,code,title,question_type,skill,content,image_url,audio_url,score,options,correct_answer,explanation,metadata,order_index',
            ])
            ->find($submissionId);
    }

    public function findSubmissionForGrading(int $submissionId): ?\App\Models\ClassExamSubmission
    {
        return \App\Models\ClassExamSubmission::query()
            ->select('id', 'class_exam_id', 'student_id', 'attempt_number', 'started_at', 'submitted_at', 'duration_seconds_used', 'score', 'total_correct', 'total_questions', 'status', 'answers', 'grading_details')
            ->with([
                'classExam:id,class_id,exam_id,title,exam_date,start_time,end_time,duration_minutes,max_score,pass_score,status',
                'classExam.exam:id,subject_id,name,code',
                'classExam.exam.sections:id,exam_id,title,description,skill,order_index',
                'classExam.exam.sections.questions:id,exam_id,section_id,code,title,question_type,skill,content,image_url,audio_url,score,options,correct_answer,explanation,metadata,order_index',
            ])
            ->find($submissionId);
    }

    public function findQuestionById(int $questionId): ?\App\Models\ExamQuestion
    {
        return \App\Models\ExamQuestion::select('id', 'exam_id', 'section_id', 'code', 'title', 'question_type', 'skill', 'content', 'image_url', 'audio_url', 'score')->find($questionId);
    }
}
