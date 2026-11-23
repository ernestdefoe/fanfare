<?php

namespace ErnestDefoe\Fanfare\Listener;

use ErnestDefoe\Fanfare\Courses;
use Flarum\User\Event\Saving;

/**
 * The recent course completions are one cached list. A member who makes their
 * courses private in Syllabus, or is suspended or unconfirmed, drops out of it
 * at once rather than when the cache runs out.
 */
class ForgetCourseList
{
    public function __construct(protected Courses $courses)
    {
    }

    public function handle(Saving $event): void
    {
        if ($event->user->isDirty(['preferences', 'suspended_until', 'is_email_confirmed'])) {
            $this->courses->forget();
        }
    }
}
