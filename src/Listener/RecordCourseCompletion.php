<?php

namespace ErnestDefoe\Fanfare\Listener;

use ErnestDefoe\Fanfare\Courses;
use Ernestdefoe\Syllabus\Certificate;
use Ernestdefoe\Syllabus\Event\CourseCompleted;

/**
 * Syllabus confirmed a member completed a course (once per member and course,
 * ever): keep it for the student's moment and the community's list. Registered
 * only while Syllabus is enabled.
 */
class RecordCourseCompletion
{
    public function __construct(protected Courses $courses)
    {
    }

    public function handle(CourseCompleted $event): void
    {
        // Syllabus issues the certificate before it announces the completion.
        $code = Certificate::query()->where('course_id', $event->course->id)->where('user_id', $event->user->id)->value('code');

        $this->courses->record($event->user, (int) $event->course->id, (string) $event->course->title, $code !== null ? (string) $code : null);
    }
}
