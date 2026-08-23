<?php

namespace App\Http\Controllers;

use App\Models\Center;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\ClassStudent;
use App\Models\ClassSubject;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use App\Models\ExamType;
use App\Models\Room;
use App\Models\RoomEquipment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentTuition;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeleteImpactController extends Controller
{
    /**
     * Get impact summary before deleting an entity.
     *
     * @param  Request      $request
     * @param  string       $entity
     * @param  int          $id
     * @return JsonResponse
     */
    public function getImpact(Request $request, string $entity, int $id): JsonResponse
    {
        $impacts = [];
        $title   = '';

        switch ($entity) {
            case 'classes':
                $class = SchoolClass::find($id);

                if (! $class) {
                    return response()->json(['error' => 'Lớp học không tồn tại'], 404);
                }
                $title = "Lớp học: {$class->name} ({$class->code})";

                $studentCount  = ClassStudent::where('class_id', $id)->count();
                $examCount     = ClassExam::where('class_id', $id)->count();
                $sessionCount  = ClassSession::whereHas('classSubject', fn ($q) => $q->where('class_id', $id))->count();
                $scheduleCount = ClassSchedule::whereHas('classSubject', fn ($q) => $q->where('class_id', $id))->count();
                $subjectCount  = ClassSubject::where('class_id', $id)->count();
                $tuitionCount  = StudentTuition::where('class_id', $id)->count();
                $chatCount     = DB::table('class_chat_messages')->where('class_id', $id)->count();

                if ($studentCount > 0) {
                    $impacts[] = "Ngắt liên kết {$studentCount} học sinh khỏi lớp";
                }

                if ($examCount > 0) {
                    $impacts[] = "Xóa {$examCount} bài thi đã tổ chức cho lớp";
                }

                if ($sessionCount > 0) {
                    $impacts[] = "Xóa {$sessionCount} ca học đã tạo";
                }

                if ($scheduleCount > 0) {
                    $impacts[] = "Xóa {$scheduleCount} lịch học cố định hàng tuần";
                }

                if ($subjectCount > 0) {
                    $impacts[] = "Gỡ phân công {$subjectCount} môn học của lớp";
                }

                if ($tuitionCount > 0) {
                    $impacts[] = "Xóa {$tuitionCount} hồ sơ học phí liên quan";
                }

                if ($chatCount > 0) {
                    $impacts[] = "Xóa {$chatCount} tin nhắn trong nhóm chat lớp";
                }

                break;

            case 'centers':
                $center = Center::find($id);

                if (! $center) {
                    return response()->json(['error' => 'Trung tâm không tồn tại'], 404);
                }
                $title = "Trung tâm: {$center->name} ({$center->code})";

                $classCount   = SchoolClass::where('center_id', $id)->count();
                $teacherCount = Teacher::where('center_id', $id)->count();
                $studentCount = Student::where('center_id', $id)->count();
                $subjectCount = Subject::where('center_id', $id)->count();
                $roomCount    = Room::where('center_id', $id)->count();
                $examCount    = Exam::where('center_id', $id)->count();
                $tuitionCount = StudentTuition::where('center_id', $id)->count();

                if ($classCount > 0) {
                    $impacts[] = "Xóa toàn bộ {$classCount} lớp học thuộc trung tâm";
                }

                if ($teacherCount > 0) {
                    $impacts[] = "Xóa tài khoản {$teacherCount} giáo viên";
                }

                if ($studentCount > 0) {
                    $impacts[] = "Xóa tài khoản {$studentCount} học sinh";
                }

                if ($subjectCount > 0) {
                    $impacts[] = "Xóa {$subjectCount} môn học thuộc trung tâm";
                }

                if ($roomCount > 0) {
                    $impacts[] = "Xóa {$roomCount} phòng học và thiết bị";
                }

                if ($examCount > 0) {
                    $impacts[] = "Xóa {$examCount} đề thi trong kho đề";
                }

                if ($tuitionCount > 0) {
                    $impacts[] = "Xóa {$tuitionCount} khoản học phí";
                }

                break;

            case 'subjects':
                $subject = Subject::find($id);

                if (! $subject) {
                    return response()->json(['error' => 'Môn học không tồn tại'], 404);
                }
                $title = "Môn học: {$subject->name} ({$subject->code})";

                $classSubjectCount = ClassSubject::where('subject_id', $id)->count();
                $examCount         = Exam::where('subject_id', $id)->count();

                if ($classSubjectCount > 0) {
                    $impacts[] = "Gỡ phân công môn học khỏi {$classSubjectCount} lớp học";
                }

                if ($examCount > 0) {
                    $impacts[] = "Hủy liên kết môn học ở {$examCount} đề thi";
                }

                break;

            case 'teachers':
                $teacher = Teacher::find($id);

                if (! $teacher) {
                    return response()->json(['error' => 'Giáo viên không tồn tại'], 404);
                }
                $title = "Giáo viên: {$teacher->full_name} ({$teacher->teacher_code})";

                $classCount   = ClassSubject::where('teacher_id', $id)->count();
                $sessionCount = ClassSession::where('teacher_id', $id)->count();
                $examCount    = Exam::where('created_by_teacher_id', $id)->count();

                if ($classCount > 0) {
                    $impacts[] = "Gỡ phân công giảng dạy tại {$classCount} lớp học";
                }

                if ($sessionCount > 0) {
                    $impacts[] = "Gỡ tên giáo viên phụ trách {$sessionCount} ca học";
                }

                if ($examCount > 0) {
                    $impacts[] = "Chuyển {$examCount} đề thi do giáo viên tạo về trung tâm quản lý";
                }

                break;

            case 'students':
                $student = Student::find($id);

                if (! $student) {
                    return response()->json(['error' => 'Học sinh không tồn tại'], 404);
                }
                $title = "Học sinh: {$student->full_name} ({$student->student_code})";

                $classCount      = ClassStudent::where('student_id', $id)->count();
                $attendanceCount = DB::table('attendances')->where('student_id', $id)->count();
                $submissionCount = ClassExamSubmission::where('student_id', $id)->count();
                $tuitionCount    = StudentTuition::where('student_id', $id)->count();

                if ($classCount > 0) {
                    $impacts[] = "Gỡ học sinh khỏi {$classCount} lớp đang ghi danh";
                }

                if ($attendanceCount > 0) {
                    $impacts[] = "Xóa {$attendanceCount} lượt điểm danh của học sinh";
                }

                if ($submissionCount > 0) {
                    $impacts[] = "Xóa {$submissionCount} bài nộp thi của học sinh";
                }

                if ($tuitionCount > 0) {
                    $impacts[] = "Xóa {$tuitionCount} hồ sơ theo dõi học phí";
                }

                break;

            case 'exams':
                $exam = Exam::find($id);

                if (! $exam) {
                    return response()->json(['error' => 'Đề thi không tồn tại'], 404);
                }
                $title = "Đề thi: {$exam->name} ({$exam->code})";

                $sectionCount   = ExamSection::where('exam_id', $id)->count();
                $questionCount  = ExamQuestion::where('exam_id', $id)->count();
                $classExamCount = ClassExam::where('exam_id', $id)->count();

                if ($sectionCount > 0) {
                    $impacts[] = "Xóa {$sectionCount} phần thi";
                }

                if ($questionCount > 0) {
                    $impacts[] = "Xóa {$questionCount} câu hỏi trong đề";
                }

                if ($classExamCount > 0) {
                    $impacts[] = "Hủy {$classExamCount} kỳ thi đã tổ chức cho các lớp dựa trên đề này";
                }

                break;

            case 'rooms':
                $room = Room::find($id);

                if (! $room) {
                    return response()->json(['error' => 'Phòng học không tồn tại'], 404);
                }
                $title = "Phòng học: {$room->name}";

                $equipmentCount = RoomEquipment::where('room_id', $id)->count();
                $sessionCount   = ClassSession::where('room_id', $id)->count();

                if ($equipmentCount > 0) {
                    $impacts[] = "Xóa {$equipmentCount} trang thiết bị trong phòng";
                }

                if ($sessionCount > 0) {
                    $impacts[] = "Gỡ phòng học khỏi {$sessionCount} ca học đã xếp lịch";
                }

                break;

            case 'exam-types':
                $examType = ExamType::find($id);

                if (! $examType) {
                    return response()->json(['error' => 'Loại đề thi không tồn tại'], 404);
                }
                $title = "Loại đề thi: {$examType->name} ({$examType->code})";

                $examCount = Exam::where('exam_type_id', $id)->count();

                if ($examCount > 0) {
                    $impacts[] = "Hủy liên kết loại đề thi ở {$examCount} bài kiểm tra";
                }

                break;

            case 'tuitions':
                $tuition = StudentTuition::with(['student:id,full_name'])->find($id);

                if (! $tuition) {
                    return response()->json(['error' => 'Khoản học phí không tồn tại'], 404);
                }
                $title = "Học phí: {$tuition->student?->full_name} - " . number_format((float) $tuition->total_amount, 0, ',', '.') . ' VNĐ';

                $paymentCount = \App\Models\TuitionPayment::where('student_tuition_id', $id)->count();

                if ($paymentCount > 0) {
                    $impacts[] = "Xóa {$paymentCount} giao dịch/đợt đóng tiền đã ghi nhận";
                }

                break;

            default:
                return response()->json(['error' => 'Entity không được hỗ trợ'], 400);
        }

        return response()->json([
            'success' => true,
            'title'   => $title,
            'impacts' => $impacts,
            'count'   => count($impacts),
        ]);
    }
}
