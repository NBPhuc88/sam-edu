<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Admins (role, status)
        if ($this->shouldConvert('admins', 'role')) {
            $intCol = $this->createIntColumnIfNotExists('admins', 'role', 2);
            DB::table('admins')->where('role', 'super_admin')->orWhere('role', '1')->update([$intCol => 1]);
            DB::table('admins')->where('role', 'admin')->orWhere('role', '2')->update([$intCol => 2]);
            $this->dropOldAndRename('admins', 'role', $intCol);
        }

        if ($this->shouldConvert('admins', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('admins', 'status', 1);
            DB::table('admins')->where('status', 'active')->orWhere('status', '1')->update([$intCol => 1]);
            DB::table('admins')->whereIn('status', ['inactive', '0'])->update([$intCol => 2]);
            DB::table('admins')->whereIn('status', ['locked', '2'])->update([$intCol => 3]);
            $this->dropOldAndRename('admins', 'status', $intCol);
        }

        // 2. Teachers (status, gender)
        if ($this->shouldConvert('teachers', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('teachers', 'status', 1);
            DB::table('teachers')->where('status', 'active')->orWhere('status', '1')->update([$intCol => 1]);
            DB::table('teachers')->whereIn('status', ['inactive', '0'])->update([$intCol => 2]);
            DB::table('teachers')->whereIn('status', ['locked', '2'])->update([$intCol => 3]);
            $this->dropOldAndRename('teachers', 'status', $intCol);
        }

        if ($this->shouldConvert('teachers', 'gender')) {
            $intCol = $this->createIntColumnIfNotExists('teachers', 'gender', 1, true);
            DB::table('teachers')->where('gender', 'male')->orWhere('gender', '1')->update([$intCol => 1]);
            DB::table('teachers')->where('gender', 'female')->orWhere('gender', '2')->update([$intCol => 2]);
            DB::table('teachers')->where('gender', 'other')->orWhere('gender', '3')->update([$intCol => 3]);
            $this->dropOldAndRename('teachers', 'gender', $intCol);
        }

        // 3. Students (status, gender)
        if ($this->shouldConvert('students', 'gender')) {
            $intCol = $this->createIntColumnIfNotExists('students', 'gender', 1, true);
            DB::table('students')->where('gender', 'male')->orWhere('gender', '1')->update([$intCol => 1]);
            DB::table('students')->where('gender', 'female')->orWhere('gender', '2')->update([$intCol => 2]);
            DB::table('students')->where('gender', 'other')->orWhere('gender', '3')->update([$intCol => 3]);
            $this->dropOldAndRename('students', 'gender', $intCol);
        }

        // 4. Centers (status → 3 trạng thái: active=1, paused=2, expired=3)
        if ($this->shouldConvert('centers', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('centers', 'status', 1);
            DB::table('centers')->whereIn('status', ['active', '1'])->update([$intCol => 1]);
            DB::table('centers')->whereIn('status', ['trial', 'pending_payment', 'locked', 'inactive', 'suspended', 'paused', '0', '2', '3'])->update([$intCol => 2]);
            DB::table('centers')->whereIn('status', ['expired', '4'])->update([$intCol => 3]);
            $this->dropOldAndRename('centers', 'status', $intCol);
        }

        if (Schema::hasColumn('centers', 'subscription_plan') && ! Schema::hasColumn('centers', 'subscription_plan_id')) {
            Schema::table('centers', function (Blueprint $table) {
                $table->unsignedBigInteger('subscription_plan_id')->nullable()->after('status');
            });

            $plans   = Schema::hasTable('subscription_plans') ? DB::table('subscription_plans')->get() : collect();
            $planMap = [];

            foreach ($plans as $p) {
                $planMap[(string) $p->code] = (int) $p->id;
                $planMap[(string) $p->id]   = (int) $p->id;
            }
            $firstPlanId = (int) ($plans->first()?->id ?? 1);

            $centers = DB::table('centers')->get(['id', 'subscription_plan']);

            foreach ($centers as $c) {
                $planVal = isset($c->subscription_plan) ? (string) $c->subscription_plan : '';
                $planId  = $planMap[$planVal] ?? $firstPlanId;
                DB::table('centers')->where('id', $c->id)->update(['subscription_plan_id' => $planId]);
            }

            DB::table('centers')->whereNull('subscription_plan_id')->update(['subscription_plan_id' => $firstPlanId]);

            Schema::table('centers', function (Blueprint $table) {
                $table->dropColumn('subscription_plan');
            });
        }

        if ($this->shouldConvert('centers', 'plan_type')) {
            $intCol = $this->createIntColumnIfNotExists('centers', 'plan_type', 1);
            DB::table('centers')->whereIn('plan_type', ['trial', 'free', '1'])->update([$intCol => 1]);
            DB::table('centers')->whereIn('plan_type', ['basic', 'standard', '2'])->update([$intCol => 2]);
            DB::table('centers')->whereIn('plan_type', ['advanced', 'premium', '3'])->update([$intCol => 3]);
            $this->dropOldAndRename('centers', 'plan_type', $intCol);
        }

        // 5. Subscription Plans (plan_type)
        if ($this->shouldConvert('subscription_plans', 'plan_type')) {
            $intCol = $this->createIntColumnIfNotExists('subscription_plans', 'plan_type', 1);
            DB::table('subscription_plans')->whereIn('plan_type', ['free', 'trial', '1'])->update([$intCol => 1]);
            DB::table('subscription_plans')->whereIn('plan_type', ['standard', 'basic', '2'])->update([$intCol => 2]);
            DB::table('subscription_plans')->whereIn('plan_type', ['premium', 'advanced', '3'])->update([$intCol => 3]);
            $this->dropOldAndRename('subscription_plans', 'plan_type', $intCol);
        }

        // 6. Center Subscriptions (plan_id, status)
        if (Schema::hasColumn('center_subscriptions', 'plan_code') && ! Schema::hasColumn('center_subscriptions', 'plan_id')) {
            Schema::table('center_subscriptions', function (Blueprint $table) {
                $table->unsignedBigInteger('plan_id')->nullable()->after('center_id');
            });

            $plans   = Schema::hasTable('subscription_plans') ? DB::table('subscription_plans')->get() : collect();
            $planMap = [];

            foreach ($plans as $p) {
                $planMap[(string) $p->code] = (int) $p->id;
                $planMap[(string) $p->id]   = (int) $p->id;
            }
            $firstPlanId = (int) ($plans->first()?->id ?? 1);

            $subs = DB::table('center_subscriptions')->get(['id', 'plan_code']);

            foreach ($subs as $sub) {
                $planVal = isset($sub->plan_code) ? (string) $sub->plan_code : '';
                $planId  = $planMap[$planVal] ?? $firstPlanId;
                DB::table('center_subscriptions')->where('id', $sub->id)->update(['plan_id' => $planId]);
            }

            DB::table('center_subscriptions')->whereNull('plan_id')->update(['plan_id' => $firstPlanId]);

            Schema::table('center_subscriptions', function (Blueprint $table) {
                $table->dropColumn('plan_code');
            });
        }

        if ($this->shouldConvert('center_subscriptions', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('center_subscriptions', 'status', 1);
            DB::table('center_subscriptions')->whereIn('status', ['pending', '0'])->update([$intCol => 1]);
            DB::table('center_subscriptions')->whereIn('status', ['active', '1'])->update([$intCol => 2]);
            DB::table('center_subscriptions')->whereIn('status', ['expired', '2'])->update([$intCol => 3]);
            DB::table('center_subscriptions')->whereIn('status', ['cancelled', '3'])->update([$intCol => 4]);
            $this->dropOldAndRename('center_subscriptions', 'status', $intCol);
        }

        // 7. Class Students (status)
        if ($this->shouldConvert('class_students', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('class_students', 'status', 1);
            DB::table('class_students')->whereIn('status', ['active', '1'])->update([$intCol => 1]);
            DB::table('class_students')->whereIn('status', ['completed', '2'])->update([$intCol => 2]);
            DB::table('class_students')->whereIn('status', ['transferred', '3'])->update([$intCol => 3]);
            DB::table('class_students')->whereIn('status', ['left', '0'])->update([$intCol => 4]);
            $this->dropOldAndRename('class_students', 'status', $intCol);
        }

        // 8. Class Subjects (status)
        if ($this->shouldConvert('class_subjects', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('class_subjects', 'status', 1);
            DB::table('class_subjects')->whereIn('status', ['active', '1'])->update([$intCol => 1]);
            DB::table('class_subjects')->whereIn('status', ['inactive', '0'])->update([$intCol => 2]);
            DB::table('class_subjects')->whereIn('status', ['completed', '2'])->update([$intCol => 3]);
            $this->dropOldAndRename('class_subjects', 'status', $intCol);
        }

        // 9. Class Schedules (status)
        if ($this->shouldConvert('class_schedules', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('class_schedules', 'status', 1);
            DB::table('class_schedules')->whereIn('status', ['active', '1'])->update([$intCol => 1]);
            DB::table('class_schedules')->whereIn('status', ['inactive', '0'])->update([$intCol => 2]);
            $this->dropOldAndRename('class_schedules', 'status', $intCol);
        }

        // 10. Class Sessions (status)
        if ($this->shouldConvert('class_sessions', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('class_sessions', 'status', 1);
            DB::table('class_sessions')->whereIn('status', ['scheduled', '1'])->update([$intCol => 1]);
            DB::table('class_sessions')->whereIn('status', ['in_progress', '2'])->update([$intCol => 2]);
            DB::table('class_sessions')->whereIn('status', ['completed', '3'])->update([$intCol => 3]);
            DB::table('class_sessions')->whereIn('status', ['cancelled', 'unattended', '0'])->update([$intCol => 4]);
            $this->dropOldAndRename('class_sessions', 'status', $intCol);
        }

        // 11. Attendances (status)
        if ($this->shouldConvert('attendances', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('attendances', 'status', 1);
            DB::table('attendances')->where('status', 'present')->orWhere('status', '1')->update([$intCol => 1]);
            DB::table('attendances')->where('status', 'absent')->orWhere('status', '2')->update([$intCol => 2]);
            DB::table('attendances')->where('status', 'late')->orWhere('status', '3')->update([$intCol => 3]);
            DB::table('attendances')->whereIn('status', ['excused', 'leave', '4'])->update([$intCol => 4]);
            $this->dropOldAndRename('attendances', 'status', $intCol);
        }

        // 12. Subjects (status)
        if ($this->shouldConvert('subjects', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('subjects', 'status', 1);
            DB::table('subjects')->whereIn('status', ['active', '1'])->update([$intCol => 1]);
            DB::table('subjects')->whereIn('status', ['inactive', '0'])->update([$intCol => 2]);
            $this->dropOldAndRename('subjects', 'status', $intCol);
        }

        // 13. Center Subjects (status)
        if ($this->shouldConvert('center_subjects', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('center_subjects', 'status', 1);
            DB::table('center_subjects')->whereIn('status', ['active', '1'])->update([$intCol => 1]);
            DB::table('center_subjects')->whereIn('status', ['inactive', '0'])->update([$intCol => 2]);
            $this->dropOldAndRename('center_subjects', 'status', $intCol);
        }

        // 14. Rooms (status)
        if ($this->shouldConvert('rooms', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('rooms', 'status', 1);
            DB::table('rooms')->whereIn('status', ['active', '1'])->update([$intCol => 1]);
            DB::table('rooms')->whereIn('status', ['paused', 'inactive', '0'])->update([$intCol => 2]);
            DB::table('rooms')->whereIn('status', ['closed', '2'])->update([$intCol => 3]);
            $this->dropOldAndRename('rooms', 'status', $intCol);
        }

        // 15. Room Equipments (status)
        if ($this->shouldConvert('room_equipments', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('room_equipments', 'status', 1);
            DB::table('room_equipments')->where('status', 'good')->orWhere('status', '1')->update([$intCol => 1]);
            DB::table('room_equipments')->where('status', 'maintenance')->orWhere('status', '2')->update([$intCol => 2]);
            DB::table('room_equipments')->where('status', 'broken')->orWhere('status', '3')->update([$intCol => 3]);
            $this->dropOldAndRename('room_equipments', 'status', $intCol);
        }

        // 16. Exams (status, skill)
        if ($this->shouldConvert('exams', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('exams', 'status', 1);
            DB::table('exams')->whereIn('status', ['draft', '0'])->update([$intCol => 1]);
            DB::table('exams')->whereIn('status', ['published', '1'])->update([$intCol => 2]);
            DB::table('exams')->whereIn('status', ['completed', '2'])->update([$intCol => 3]);
            DB::table('exams')->whereIn('status', ['cancelled', '3'])->update([$intCol => 4]);
            $this->dropOldAndRename('exams', 'status', $intCol);
        }

        if ($this->shouldConvert('exams', 'skill')) {
            $intCol = $this->createIntColumnIfNotExists('exams', 'skill', 1, true);
            DB::table('exams')->where('skill', 'listening')->orWhere('skill', '1')->update([$intCol => 1]);
            DB::table('exams')->where('skill', 'reading')->orWhere('skill', '2')->update([$intCol => 2]);
            DB::table('exams')->where('skill', 'writing')->orWhere('skill', '3')->update([$intCol => 3]);
            DB::table('exams')->where('skill', 'speaking')->orWhere('skill', '4')->update([$intCol => 4]);
            $this->dropOldAndRename('exams', 'skill', $intCol);
        }

        // 17. Class Exams (status)
        if ($this->shouldConvert('class_exams', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('class_exams', 'status', 1);
            DB::table('class_exams')->whereIn('status', ['scheduled', '1'])->update([$intCol => 1]);
            DB::table('class_exams')->whereIn('status', ['ongoing', '2'])->update([$intCol => 2]);
            DB::table('class_exams')->whereIn('status', ['completed', '3'])->update([$intCol => 3]);
            DB::table('class_exams')->whereIn('status', ['cancelled', '0'])->update([$intCol => 4]);
            $this->dropOldAndRename('class_exams', 'status', $intCol);
        }

        // 18. Class Exam Submissions (status)
        if ($this->shouldConvert('class_exam_submissions', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('class_exam_submissions', 'status', 1);
            DB::table('class_exam_submissions')->whereIn('status', ['in_progress', '1'])->update([$intCol => 1]);
            DB::table('class_exam_submissions')->whereIn('status', ['submitted', '2'])->update([$intCol => 2]);
            DB::table('class_exam_submissions')->whereIn('status', ['timeout_submitted', '3'])->update([$intCol => 3]);
            DB::table('class_exam_submissions')->whereIn('status', ['missed', '0'])->update([$intCol => 4]);
            $this->dropOldAndRename('class_exam_submissions', 'status', $intCol);
        }

        // 19. Student Tuitions (status)
        if ($this->shouldConvert('student_tuitions', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('student_tuitions', 'status', 1);
            DB::table('student_tuitions')->whereIn('status', ['pending', '0'])->update([$intCol => 1]);
            DB::table('student_tuitions')->whereIn('status', ['completed', 'paid', '1'])->update([$intCol => 2]);
            DB::table('student_tuitions')->whereIn('status', ['partial', '2'])->update([$intCol => 3]);
            DB::table('student_tuitions')->whereIn('status', ['overdue', '3'])->update([$intCol => 4]);
            $this->dropOldAndRename('student_tuitions', 'status', $intCol);
        }

        // 20. Tuition Payments (payment_method)
        if ($this->shouldConvert('tuition_payments', 'payment_method')) {
            $intCol = $this->createIntColumnIfNotExists('tuition_payments', 'payment_method', 1);
            DB::table('tuition_payments')->where('payment_method', 'cash')->orWhere('payment_method', '1')->update([$intCol => 1]);
            DB::table('tuition_payments')->where('payment_method', 'bank_transfer')->orWhere('payment_method', '2')->update([$intCol => 2]);
            DB::table('tuition_payments')->where('payment_method', 'momo')->orWhere('payment_method', '3')->update([$intCol => 3]);
            DB::table('tuition_payments')->where('payment_method', 'zalopay')->orWhere('payment_method', '4')->update([$intCol => 4]);
            DB::table('tuition_payments')->where('payment_method', 'credit_card')->orWhere('payment_method', '5')->update([$intCol => 5]);
            DB::table('tuition_payments')->where('payment_method', 'other')->orWhere('payment_method', '99')->update([$intCol => 99]);
            $this->dropOldAndRename('tuition_payments', 'payment_method', $intCol);
        }

        // 21. Payment Transactions (status, payment_method)
        if ($this->shouldConvert('payment_transactions', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('payment_transactions', 'status', 1);
            DB::table('payment_transactions')->whereIn('status', ['pending', '0'])->update([$intCol => 1]);
            DB::table('payment_transactions')->whereIn('status', ['success', '1'])->update([$intCol => 2]);
            DB::table('payment_transactions')->whereIn('status', ['failed', '2'])->update([$intCol => 3]);
            DB::table('payment_transactions')->whereIn('status', ['refunded', '3'])->update([$intCol => 4]);
            $this->dropOldAndRename('payment_transactions', 'status', $intCol);
        }

        if ($this->shouldConvert('payment_transactions', 'payment_method')) {
            $intCol = $this->createIntColumnIfNotExists('payment_transactions', 'payment_method', 4);
            DB::table('payment_transactions')->where('payment_method', 'cash')->orWhere('payment_method', '1')->update([$intCol => 1]);
            DB::table('payment_transactions')->where('payment_method', 'bank_transfer')->orWhere('payment_method', '2')->update([$intCol => 2]);
            DB::table('payment_transactions')->where('payment_method', 'momo')->orWhere('payment_method', '3')->update([$intCol => 3]);
            DB::table('payment_transactions')->where('payment_method', 'zalopay')->orWhere('payment_method', '4')->update([$intCol => 4]);
            DB::table('payment_transactions')->where('payment_method', 'credit_card')->orWhere('payment_method', '5')->update([$intCol => 5]);
            DB::table('payment_transactions')->where('payment_method', 'other')->orWhere('payment_method', '99')->update([$intCol => 99]);
            $this->dropOldAndRename('payment_transactions', 'payment_method', $intCol);
        }

        // 22. Contact Requests (status)
        if ($this->shouldConvert('contact_requests', 'status')) {
            $intCol = $this->createIntColumnIfNotExists('contact_requests', 'status', 1);
            DB::table('contact_requests')->whereIn('status', ['pending', '0'])->update([$intCol => 1]);
            DB::table('contact_requests')->whereIn('status', ['contacted', '1'])->update([$intCol => 2]);
            DB::table('contact_requests')->whereIn('status', ['resolved', '2'])->update([$intCol => 3]);
            DB::table('contact_requests')->whereIn('status', ['cancelled', '3'])->update([$intCol => 4]);
            $this->dropOldAndRename('contact_requests', 'status', $intCol);
        }

        // 23. Account Verification OTPs (action)
        if ($this->shouldConvert('account_verification_otps', 'action')) {
            $intCol = $this->createIntColumnIfNotExists('account_verification_otps', 'action', 1);
            DB::table('account_verification_otps')->where('action', 'change_password')->orWhere('action', '1')->update([$intCol => 1]);
            DB::table('account_verification_otps')->where('action', 'change_email_old')->orWhere('action', '2')->update([$intCol => 2]);
            DB::table('account_verification_otps')->where('action', 'change_email_new')->orWhere('action', '3')->update([$intCol => 3]);
            DB::table('account_verification_otps')->where('action', 'password_reset')->orWhere('action', '4')->update([$intCol => 4]);
            $this->dropOldAndRename('account_verification_otps', 'action', $intCol);
        }

        // 24. Password Reset OTPs (account_type)
        if ($this->shouldConvert('password_reset_otps', 'account_type')) {
            $intCol = $this->createIntColumnIfNotExists('password_reset_otps', 'account_type', 1);
            DB::table('password_reset_otps')->where('account_type', 'admin')->orWhere('account_type', '1')->update([$intCol => 1]);
            DB::table('password_reset_otps')->where('account_type', 'teacher')->orWhere('account_type', '2')->update([$intCol => 2]);
            DB::table('password_reset_otps')->where('account_type', 'student')->orWhere('account_type', '3')->update([$intCol => 3]);
            DB::table('password_reset_otps')->where('account_type', 'center')->orWhere('account_type', '4')->update([$intCol => 4]);
            $this->dropOldAndRename('password_reset_otps', 'account_type', $intCol);
        }

        // 25. Class Chat Messages (sender_type)
        if ($this->shouldConvert('class_chat_messages', 'sender_type')) {
            $intCol = $this->createIntColumnIfNotExists('class_chat_messages', 'sender_type', 3);
            DB::table('class_chat_messages')->where('sender_type', 'admin')->orWhere('sender_type', '1')->update([$intCol => 1]);
            DB::table('class_chat_messages')->where('sender_type', 'teacher')->orWhere('sender_type', '2')->update([$intCol => 2]);
            DB::table('class_chat_messages')->where('sender_type', 'student')->orWhere('sender_type', '3')->update([$intCol => 3]);
            $this->dropOldAndRename('class_chat_messages', 'sender_type', $intCol);
        }

        // 26. Class Chat Message Reactions (sender_type)
        if ($this->shouldConvert('class_chat_message_reactions', 'sender_type')) {
            $intCol = $this->createIntColumnIfNotExists('class_chat_message_reactions', 'sender_type', 3);
            DB::table('class_chat_message_reactions')->where('sender_type', 'admin')->orWhere('sender_type', '1')->update([$intCol => 1]);
            DB::table('class_chat_message_reactions')->where('sender_type', 'teacher')->orWhere('sender_type', '2')->update([$intCol => 2]);
            DB::table('class_chat_message_reactions')->where('sender_type', 'student')->orWhere('sender_type', '3')->update([$intCol => 3]);
            $this->dropOldAndRename('class_chat_message_reactions', 'sender_type', $intCol);
        }

        // 27. Exam Sections (skill)
        if ($this->shouldConvert('exam_sections', 'skill')) {
            $intCol = $this->createIntColumnIfNotExists('exam_sections', 'skill', 2);
            DB::table('exam_sections')->where('skill', 'listening')->orWhere('skill', '1')->update([$intCol => 1]);
            DB::table('exam_sections')->where('skill', 'reading')->orWhere('skill', '2')->update([$intCol => 2]);
            DB::table('exam_sections')->where('skill', 'writing')->orWhere('skill', '3')->update([$intCol => 3]);
            DB::table('exam_sections')->where('skill', 'speaking')->orWhere('skill', '4')->update([$intCol => 4]);
            $this->dropOldAndRename('exam_sections', 'skill', $intCol);
        }

        // 28. Exam Questions (question_type, skill)
        if ($this->shouldConvert('exam_questions', 'question_type')) {
            $intCol = $this->createIntColumnIfNotExists('exam_questions', 'question_type', 1);
            DB::table('exam_questions')->where('question_type', 'single_choice')->orWhere('question_type', '1')->update([$intCol => 1]);
            DB::table('exam_questions')->where('question_type', 'multiple_choice')->orWhere('question_type', '2')->update([$intCol => 2]);
            DB::table('exam_questions')->where('question_type', 'true_false_not_given')->orWhere('question_type', '3')->update([$intCol => 3]);
            DB::table('exam_questions')->where('question_type', 'fill_in_blank')->orWhere('question_type', '4')->update([$intCol => 4]);
            DB::table('exam_questions')->where('question_type', 'drag_drop_cloze')->orWhere('question_type', '5')->update([$intCol => 5]);
            DB::table('exam_questions')->where('question_type', 'matching')->orWhere('question_type', '6')->update([$intCol => 6]);
            DB::table('exam_questions')->where('question_type', 'matching_image')->orWhere('question_type', '7')->update([$intCol => 7]);
            DB::table('exam_questions')->where('question_type', 'matching_sentences')->orWhere('question_type', '8')->update([$intCol => 8]);
            DB::table('exam_questions')->where('question_type', 'ordering')->orWhere('question_type', '9')->update([$intCol => 9]);
            DB::table('exam_questions')->where('question_type', 'diagram_labelling')->orWhere('question_type', '10')->update([$intCol => 10]);
            DB::table('exam_questions')->where('question_type', 'find_mistake')->orWhere('question_type', '11')->update([$intCol => 11]);
            DB::table('exam_questions')->where('question_type', 'essay')->orWhere('question_type', '12')->update([$intCol => 12]);
            DB::table('exam_questions')->whereIn('question_type', ['audio_record', 'speaking', 'oral', '13'])->update([$intCol => 13]);
            DB::table('exam_questions')->whereIn('question_type', ['short_answer', '14'])->update([$intCol => 14]);
            $this->dropOldAndRename('exam_questions', 'question_type', $intCol);
        }

        if ($this->shouldConvert('exam_questions', 'skill')) {
            $intCol = $this->createIntColumnIfNotExists('exam_questions', 'skill', 2);
            DB::table('exam_questions')->where('skill', 'listening')->orWhere('skill', '1')->update([$intCol => 1]);
            DB::table('exam_questions')->where('skill', 'reading')->orWhere('skill', '2')->update([$intCol => 2]);
            DB::table('exam_questions')->where('skill', 'writing')->orWhere('skill', '3')->update([$intCol => 3]);
            DB::table('exam_questions')->where('skill', 'speaking')->orWhere('skill', '4')->update([$intCol => 4]);
            $this->dropOldAndRename('exam_questions', 'skill', $intCol);
        }

        // 29. Notifications (type)
        if ($this->shouldConvert('notifications', 'type')) {
            $intCol = $this->createIntColumnIfNotExists('notifications', 'type', 1);
            DB::table('notifications')->whereIn('type', ['general', 'system', '1'])->update([$intCol => 1]);
            DB::table('notifications')->whereIn('type', ['tuition', 'payment', '2'])->update([$intCol => 2]);
            DB::table('notifications')->whereIn('type', ['exam', 'grade', '3'])->update([$intCol => 3]);
            DB::table('notifications')->whereIn('type', ['schedule', 'session', '4'])->update([$intCol => 4]);
            DB::table('notifications')->whereIn('type', ['attendance', '5'])->update([$intCol => 5]);
            $this->dropOldAndRename('notifications', 'type', $intCol);
        }

        // 30. Notification Recipients (recipient_type)
        if ($this->shouldConvert('notification_recipients', 'recipient_type')) {
            $intCol = $this->createIntColumnIfNotExists('notification_recipients', 'recipient_type', 3);
            DB::table('notification_recipients')->where('recipient_type', 'admin')->orWhere('recipient_type', '1')->update([$intCol => 1]);
            DB::table('notification_recipients')->where('recipient_type', 'teacher')->orWhere('recipient_type', '2')->update([$intCol => 2]);
            DB::table('notification_recipients')->where('recipient_type', 'student')->orWhere('recipient_type', '3')->update([$intCol => 3]);
            $this->dropOldAndRename('notification_recipients', 'recipient_type', $intCol);
        }

        // 31. Role Permissions (role)
        if ($this->shouldConvert('role_permissions', 'role')) {
            $intCol = $this->createIntColumnIfNotExists('role_permissions', 'role', 2);
            DB::table('role_permissions')->where('role', 'super_admin')->orWhere('role', '1')->update([$intCol => 1]);
            DB::table('role_permissions')->where('role', 'admin')->orWhere('role', '2')->update([$intCol => 2]);
            DB::table('role_permissions')->where('role', 'teacher')->orWhere('role', '3')->update([$intCol => 3]);
            DB::table('role_permissions')->where('role', 'student')->orWhere('role', '4')->update([$intCol => 4]);
            $this->dropOldAndRename('role_permissions', 'role', $intCol);
        }

        // ── Bước cuối: Shift giá trị 0-based → 1-based cho các bảng đã là tinyint ──

        // 32. students.status (đã là tinyint, cần shift: 0→2 inactive, 2→3 graduated)
        if (Schema::hasTable('students') && Schema::hasColumn('students', 'status')) {
            $type = strtolower((string) Schema::getColumnType('students', 'status'));

            if (in_array($type, ['integer', 'tinyint', 'smallint', 'bigint', 'int'], true)) {
                DB::statement('
                    UPDATE students SET status = CASE
                        WHEN status = 2 THEN 3
                        WHEN status = 0 THEN 2
                        ELSE status
                    END
                    WHERE status IN (0, 2)
                ');
            }
        }

        // 33. classes.status (đã là tinyint, cần shift: 0→2 inactive, 2→3 completed)
        if (Schema::hasTable('classes') && Schema::hasColumn('classes', 'status')) {
            $type = strtolower((string) Schema::getColumnType('classes', 'status'));

            if (in_array($type, ['integer', 'tinyint', 'smallint', 'bigint', 'int'], true)) {
                DB::statement('
                    UPDATE classes SET status = CASE
                        WHEN status = 2 THEN 3
                        WHEN status = 0 THEN 2
                        ELSE status
                    END
                    WHERE status IN (0, 2)
                ');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op or reverse if necessary
    }

    /**
     * Kiểm tra xem cột có cần chuyển đổi sang integer hay không.
     * Nếu không có bảng, không có cột, hoặc cột đã là integer/tinyint thì bỏ qua.
     * @param string $table
     * @param string $column
     */
    protected function shouldConvert(string $table, string $column): bool
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return false;
        }

        $intColumn = "{$column}_int";

        try {
            $type = strtolower((string) Schema::getColumnType($table, $column));

            if (in_array($type, ['integer', 'tinyint', 'smallint', 'bigint', 'int'], true)) {
                // Nếu cột gốc đã là kiểu số nguyên mà vẫn còn cột tạm _int thì dọn dẹp xóa bỏ
                if (Schema::hasColumn($table, $intColumn)) {
                    Schema::table($table, function (Blueprint $t) use ($intColumn) {
                        $t->dropColumn($intColumn);
                    });
                }

                return false;
            }
        } catch (\Throwable $e) {
            // Không xác định được kiểu cột -> tiếp tục xử lý
        }

        return true;
    }

    /**
     * Tạo cột tạm _int nếu chưa tồn tại
     * @param string $table
     * @param string $column
     * @param int    $default
     * @param bool   $nullable
     */
    protected function createIntColumnIfNotExists(string $table, string $column, int $default = 0, bool $nullable = false): string
    {
        $intColumn = "{$column}_int";

        if (! Schema::hasColumn($table, $intColumn)) {
            Schema::table($table, function (Blueprint $t) use ($intColumn, $column, $default, $nullable) {
                $col = $t->unsignedTinyInteger($intColumn)->default($default);

                if ($nullable) {
                    $col->nullable();
                }
                $col->after($column);
            });
        }

        return $intColumn;
    }

    /**
     * Xóa cột cũ và đổi tên cột _int về tên cột gốc an toàn, đồng thời tái tạo lại các index
     * @param string $table
     * @param string $column
     * @param string $intColumn
     */
    protected function dropOldAndRename(string $table, string $column, string $intColumn): void
    {
        if (Schema::hasColumn($table, $column) && Schema::hasColumn($table, $intColumn)) {
            $droppedIndexes = [];

            try {
                $indexes = Schema::getIndexes($table);

                foreach ($indexes as $idx) {
                    if (! empty($idx['primary'])) {
                        continue;
                    }

                    if (in_array($column, $idx['columns'] ?? [], true)) {
                        $droppedIndexes[] = $idx;
                        Schema::table($table, function (Blueprint $t) use ($idx) {
                            $t->dropIndex($idx['name']);
                        });
                    }
                }
            } catch (\Throwable $e) {
                // Bỏ qua lỗi index nếu không hỗ trợ
            }

            Schema::table($table, function (Blueprint $t) use ($column) {
                $t->dropColumn($column);
            });
            Schema::table($table, function (Blueprint $t) use ($intColumn, $column) {
                $t->renameColumn($intColumn, $column);
            });

            // Tái tạo lại các index đã bị xóa sau khi rename cột về tên gốc
            if (! empty($droppedIndexes)) {
                foreach ($droppedIndexes as $idx) {
                    try {
                        $cols     = $idx['columns'] ?? [];
                        $idxName  = $idx['name'] ?? null;
                        $isUnique = ! empty($idx['unique']);

                        if (! empty($cols)) {
                            Schema::table($table, function (Blueprint $t) use ($cols, $idxName, $isUnique) {
                                if ($isUnique) {
                                    $t->unique($cols, $idxName);
                                } else {
                                    $t->index($cols, $idxName);
                                }
                            });
                        }
                    } catch (\Throwable $e) {
                        // Bỏ qua lỗi nếu index không tạo lại được hoặc đã tồn tại
                    }
                }
            }
        }
    }
};
