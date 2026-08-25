<?php

namespace App\Services\Impact;

use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Exam\ExamRepositoryInterface;
use App\Repositories\ExamType\ExamTypeRepositoryInterface;
use App\Repositories\Room\RoomRepositoryInterface;
use App\Repositories\Student\StudentRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use App\Repositories\Tuition\StudentTuitionRepositoryInterface;
use Illuminate\Support\Facades\DB;

class DeleteImpactService implements DeleteImpactServiceInterface
{
    public function __construct(
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected SubjectRepositoryInterface $subjectRepository,
        protected TeacherRepositoryInterface $teacherRepository,
        protected StudentRepositoryInterface $studentRepository,
        protected ExamRepositoryInterface $examRepository,
        protected RoomRepositoryInterface $roomRepository,
        protected ExamTypeRepositoryInterface $examTypeRepository,
        protected StudentTuitionRepositoryInterface $studentTuitionRepository
    ) {
    }

    /**
     * Get impact summary before deleting an entity.
     *
     * @param  string               $entity
     * @param  int                  $id
     * @return array<string, mixed>
     */
    public function getImpact(string $entity, int $id): array
    {
        $impacts = [];
        $title   = '';

        switch ($entity) {
            case 'classes':
                $class = $this->schoolClassRepository->find($id);

                if (! $class) {
                    return ['error' => 'Lớp học không tồn tại', 'status' => 404];
                }
                $title = "Lớp học: {$class->name} ({$class->code})";

                $studentCount  = DB::table('class_students')->where('class_id', $id)->whereNull('deleted_at')->count();
                $examCount     = DB::table('class_exams')->where('class_id', $id)->whereNull('deleted_at')->count();
                $sessionCount  = DB::table('class_sessions')->where('class_id', $id)->whereNull('deleted_at')->count();
                $scheduleCount = DB::table('class_schedules')->where('class_id', $id)->count();
                $subjectCount  = DB::table('class_subjects')->where('class_id', $id)->count();
                $tuitionCount  = DB::table('student_tuitions')->where('class_id', $id)->whereNull('deleted_at')->count();
                $chatCount     = DB::table('class_chat_messages')->where('class_id', $id)->count();

                if ($studentCount > 0) {
                    $impacts[] = "Ngắt liên kết {$studentCount} học sinh khỏi lớp";
                }

                if ($examCount > 0) {
                    $impacts[] = "Hủy {$examCount} bài kiểm tra / đợt thi được giao cho lớp";
                }

                if ($sessionCount > 0) {
                    $impacts[] = "Xóa {$sessionCount} buổi học đã xếp lịch";
                }

                if ($scheduleCount > 0) {
                    $impacts[] = "Hủy {$scheduleCount} khung giờ học định kỳ hàng tuần";
                }

                if ($subjectCount > 0) {
                    $impacts[] = "Xóa {$subjectCount} phân công môn học & giáo viên của lớp";
                }

                if ($tuitionCount > 0) {
                    $impacts[] = "Gỡ thông tin lớp ở {$tuitionCount} hồ sơ học phí của học sinh";
                }

                if ($chatCount > 0) {
                    $impacts[] = "Xóa toàn bộ {$chatCount} tin nhắn trong nhóm chat của lớp";
                }

                break;

            case 'centers':
                $center = $this->centerRepository->find($id);

                if (! $center) {
                    return ['error' => 'Trung tâm không tồn tại', 'status' => 404];
                }
                $title = "Trung tâm: {$center->name} ({$center->code})";

                $classCount   = DB::table('classes')->where('center_id', $id)->whereNull('deleted_at')->count();
                $teacherCount = DB::table('teachers')->where('center_id', $id)->whereNull('deleted_at')->count();
                $studentCount = DB::table('students')->where('center_id', $id)->whereNull('deleted_at')->count();
                $subjectCount = DB::table('subjects')->where('center_id', $id)->whereNull('deleted_at')->count();
                $roomCount    = DB::table('rooms')->where('center_id', $id)->whereNull('deleted_at')->count();
                $examCount    = DB::table('exams')->where('center_id', $id)->whereNull('deleted_at')->count();
                $tuitionCount = DB::table('student_tuitions')->where('center_id', $id)->whereNull('deleted_at')->count();

                if ($classCount > 0) {
                    $impacts[] = "Ẩn {$classCount} lớp học thuộc trung tâm";
                }

                if ($teacherCount > 0) {
                    $impacts[] = "Ẩn {$teacherCount} tài khoản giáo viên trực thuộc";
                }

                if ($studentCount > 0) {
                    $impacts[] = "Ẩn {$studentCount} hồ sơ học sinh trực thuộc";
                }

                if ($subjectCount > 0) {
                    $impacts[] = "Ẩn {$subjectCount} môn học của trung tâm";
                }

                if ($roomCount > 0) {
                    $impacts[] = "Ẩn {$roomCount} phòng học";
                }

                if ($examCount > 0) {
                    $impacts[] = "Ẩn {$examCount} đề thi ngân hàng câu hỏi";
                }

                if ($tuitionCount > 0) {
                    $impacts[] = "Ẩn {$tuitionCount} hồ sơ học phí";
                }

                break;

            case 'subjects':
                $subject = $this->subjectRepository->find($id);

                if (! $subject) {
                    return ['error' => 'Môn học không tồn tại', 'status' => 404];
                }
                $title = "Môn học: {$subject->name} ({$subject->code})";

                $classSubjectCount = DB::table('class_subjects')->where('subject_id', $id)->count();
                $examCount         = DB::table('exams')->where('subject_id', $id)->whereNull('deleted_at')->count();

                if ($classSubjectCount > 0) {
                    $impacts[] = "Gỡ môn học khỏi {$classSubjectCount} lớp đang giảng dạy";
                }

                if ($examCount > 0) {
                    $impacts[] = "Gỡ liên kết môn học ở {$examCount} đề thi trong ngân hàng";
                }

                break;

            case 'teachers':
                $teacher = $this->teacherRepository->find($id);

                if (! $teacher) {
                    return ['error' => 'Giáo viên không tồn tại', 'status' => 404];
                }
                $title = "Giáo viên: {$teacher->full_name} ({$teacher->username})";

                $today              = now()->toDateString();
                $futureSessionCount = DB::table('class_sessions')
                    ->where('teacher_id', $id)
                    ->where('session_date', '>=', $today)
                    ->where('status', 'scheduled')
                    ->whereNull('deleted_at')
                    ->count();

                $activeClassCount = DB::table('class_subjects')
                    ->join('classes', 'class_subjects.class_id', '=', 'classes.id')
                    ->where('class_subjects.teacher_id', $id)
                    ->where('class_subjects.status', 'active')
                    ->where('classes.status', 1)
                    ->whereNull('classes.deleted_at')
                    ->count();

                $completedSessionCount = DB::table('class_sessions')
                    ->where('teacher_id', $id)
                    ->where('status', 'completed')
                    ->whereNull('deleted_at')
                    ->count();

                $examCount = DB::table('exams')->where('created_by_teacher_id', $id)->whereNull('deleted_at')->count();

                if ($futureSessionCount > 0) {
                    $impacts[] = "⚠️ Còn {$futureSessionCount} ca học chưa hoàn thành (cần điều chỉnh lịch dạy của giáo viên trước khi xóa)";
                }

                if ($activeClassCount > 0) {
                    $impacts[] = "⚠️ Đang phụ trách {$activeClassCount} lớp học đang hoạt động (cần phân công giáo viên thay thế trước khi xóa)";
                }

                if ($completedSessionCount > 0) {
                    $impacts[] = "Bảo toàn dữ liệu {$completedSessionCount} ca học đã hoàn thành";
                }

                if ($examCount > 0) {
                    $impacts[] = "Bảo toàn {$examCount} đề thi do giáo viên này đã tạo";
                }

                break;

            case 'students':
                $student = $this->studentRepository->find($id);

                if (! $student) {
                    return ['error' => 'Học sinh không tồn tại', 'status' => 404];
                }
                $title = "Học sinh: {$student->full_name} ({$student->student_code})";

                $classCount      = DB::table('class_students')->where('student_id', $id)->whereNull('deleted_at')->count();
                $attendanceCount = DB::table('attendances')->where('student_id', $id)->count();
                $submissionCount = DB::table('class_exam_submissions')->where('student_id', $id)->count();
                $tuitionCount    = DB::table('student_tuitions')->where('student_id', $id)->whereNull('deleted_at')->count();

                if ($classCount > 0) {
                    $impacts[] = "Ngắt ghi danh tại {$classCount} lớp học";
                }

                if ($attendanceCount > 0) {
                    $impacts[] = "Ẩn dữ liệu {$attendanceCount} lượt điểm danh chuyên cần";
                }

                if ($submissionCount > 0) {
                    $impacts[] = "Ẩn {$submissionCount} bài làm và bảng điểm thi";
                }

                if ($tuitionCount > 0) {
                    $impacts[] = "Ẩn {$tuitionCount} hồ sơ học phí của học sinh";
                }

                break;

            case 'exams':
                $exam = $this->examRepository->find($id);

                if (! $exam) {
                    return ['error' => 'Đề thi không tồn tại', 'status' => 404];
                }
                $title = "Đề thi: {$exam->title} ({$exam->code})";

                $sectionCount   = DB::table('exam_sections')->where('exam_id', $id)->count();
                $questionCount  = DB::table('exam_questions')->where('exam_id', $id)->count();
                $classExamCount = DB::table('class_exams')->where('exam_id', $id)->whereNull('deleted_at')->count();

                if ($sectionCount > 0) {
                    $impacts[] = "Xóa {$sectionCount} phần thi của đề";
                }

                if ($questionCount > 0) {
                    $impacts[] = "Xóa {$questionCount} câu hỏi trong đề";
                    $impacts[] = 'Xóa toàn bộ hình ảnh và tệp tin media đính kèm trong đề thi';
                }

                if ($classExamCount > 0) {
                    $impacts[] = "Hủy {$classExamCount} kỳ thi đã tổ chức cho các lớp dựa trên đề này";
                }

                break;

            case 'rooms':
                $room = $this->roomRepository->find($id);

                if (! $room) {
                    return ['error' => 'Phòng học không tồn tại', 'status' => 404];
                }
                $title = "Phòng học: {$room->name}";

                $equipmentCount = DB::table('room_equipment')->where('room_id', $id)->count();
                $sessionCount   = DB::table('class_sessions')->where('room_id', $id)->whereNull('deleted_at')->count();

                if ($equipmentCount > 0) {
                    $impacts[] = "Xóa {$equipmentCount} trang thiết bị trong phòng";
                }

                if ($sessionCount > 0) {
                    $impacts[] = "Gỡ phòng học khỏi {$sessionCount} ca học đã xếp lịch";
                }

                break;

            case 'exam-types':
                $examType = $this->examTypeRepository->find($id);

                if (! $examType) {
                    return ['error' => 'Loại đề thi không tồn tại', 'status' => 404];
                }
                $title = "Loại đề thi: {$examType->name} ({$examType->code})";

                $examCount = DB::table('exams')->where('exam_type_id', $id)->whereNull('deleted_at')->count();

                if ($examCount > 0) {
                    $impacts[] = "Hủy liên kết loại đề thi ở {$examCount} bài kiểm tra";
                }

                break;

            case 'tuitions':
                $tuition = $this->studentTuitionRepository->find($id);

                if (! $tuition) {
                    return ['error' => 'Khoản học phí không tồn tại', 'status' => 404];
                }
                $title = "Học phí: {$tuition->student?->full_name} - " . number_format((float) $tuition->total_amount, 0, ',', '.') . ' VNĐ';

                $paymentCount = DB::table('tuition_payments')->where('student_tuition_id', $id)->whereNull('deleted_at')->count();

                if ($paymentCount > 0) {
                    $impacts[] = "Xóa {$paymentCount} giao dịch/đợt đóng tiền đã ghi nhận";
                }

                break;

            default:
                return ['error' => 'Entity không được hỗ trợ', 'status' => 400];
        }

        return [
            'success' => true,
            'title'   => $title,
            'impacts' => $impacts,
            'count'   => count($impacts),
        ];
    }
}
