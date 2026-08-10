<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Table: students
        $this->addFulltext('students', ['full_name', 'email', 'phone', 'student_code', 'parent_name', 'parent_phone'], 'students_search_fulltext');
        $this->addIndex('students', ['center_id', 'status'], 'students_center_status_idx');

        // 2. Table: teachers
        $this->addFulltext('teachers', ['full_name', 'email', 'phone', 'teacher_code', 'specialization'], 'teachers_search_fulltext');
        $this->addIndex('teachers', ['center_id', 'status'], 'teachers_center_status_idx');

        // 3. Table: admins
        $this->addFulltext('admins', ['full_name', 'email', 'phone', 'username'], 'admins_search_fulltext');
        $this->addIndex('admins', ['status'], 'admins_status_idx');

        // 4. Table: centers
        $this->addFulltext('centers', ['name', 'code', 'email', 'phone', 'address'], 'centers_search_fulltext');
        $this->addIndex('centers', ['status'], 'centers_status_idx');

        // 5. Table: classes
        $this->addFulltext('classes', ['name', 'code'], 'classes_search_fulltext');
        $this->addIndex('classes', ['center_id', 'status'], 'classes_center_status_idx');

        // 6. Table: subjects
        $this->addFulltext('subjects', ['name', 'code'], 'subjects_search_fulltext');

        // 7. Table: exams
        $this->addFulltext('exams', ['name'], 'exams_search_fulltext');

        // 8. Table: class_chat_messages
        $this->addFulltext('class_chat_messages', ['message', 'sender_name'], 'chat_messages_search_fulltext');

        // 9. Table: contact_requests
        $this->addFulltext('contact_requests', ['full_name', 'email', 'phone', 'message'], 'contact_requests_search_fulltext');
        $this->addIndex('contact_requests', ['status'], 'contact_requests_status_idx');

        // 10. Table: notifications
        $this->addFulltext('notifications', ['title', 'content'], 'notifications_search_fulltext');

        // 11. Table: payment_transactions
        $this->addFulltext('payment_transactions', ['app_trans_id'], 'payment_trans_search_fulltext');
    }

    public function down(): void
    {
        $this->dropFulltext('students', 'students_search_fulltext');
        $this->dropIndex('students', 'students_center_status_idx');

        $this->dropFulltext('teachers', 'teachers_search_fulltext');
        $this->dropIndex('teachers', 'teachers_center_status_idx');

        $this->dropFulltext('admins', 'admins_search_fulltext');
        $this->dropIndex('admins', 'admins_status_idx');

        $this->dropFulltext('centers', 'centers_search_fulltext');
        $this->dropIndex('centers', 'centers_status_idx');

        $this->dropFulltext('classes', 'classes_search_fulltext');
        $this->dropIndex('classes', 'classes_center_status_idx');

        $this->dropFulltext('subjects', 'subjects_search_fulltext');

        $this->dropFulltext('exams', 'exams_search_fulltext');

        $this->dropFulltext('class_chat_messages', 'chat_messages_search_fulltext');

        $this->dropFulltext('contact_requests', 'contact_requests_search_fulltext');
        $this->dropIndex('contact_requests', 'contact_requests_status_idx');

        $this->dropFulltext('notifications', 'notifications_search_fulltext');

        $this->dropFulltext('payment_transactions', 'payment_trans_search_fulltext');
    }

    /**
     * @param  array<int, string>  $columns
     */
    protected function addFulltext(string $tableName, array $columns, string $indexName): void
    {
        try {
            Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName) {
                $table->fullText($columns, $indexName);
            });
        } catch (Throwable $e) {
            // Ignore if index already exists
        }
    }

    /**
     * @param  array<int, string>  $columns
     */
    protected function addIndex(string $tableName, array $columns, string $indexName): void
    {
        try {
            Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName) {
                $table->index($columns, $indexName);
            });
        } catch (Throwable $e) {
            // Ignore if index already exists
        }
    }

    protected function dropFulltext(string $tableName, string $indexName): void
    {
        try {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->dropFullText($indexName);
            });
        } catch (Throwable $e) {
            // Ignore if index does not exist
        }
    }

    protected function dropIndex(string $tableName, string $indexName): void
    {
        try {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        } catch (Throwable $e) {
            // Ignore if index does not exist
        }
    }
};
