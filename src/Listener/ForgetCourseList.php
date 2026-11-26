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
        $user = $event->user;
        // Preferences are one column: only Syllabus's show-my-courses choice matters here
        // (not, say, Fanfare's own daily "seen" mark).
        $shown = fn (mixed $prefs) => (is_array($prefs) ? $prefs : (json_decode((string) $prefs, true) ?: []))['syllabusShowCourses'] ?? true;

        if ($user->isDirty(['suspended_until', 'is_email_confirmed'])
            || ($user->isDirty('preferences') && $shown($user->getOriginal('preferences')) !== $shown($user->getAttribute('preferences')))) {
            $this->courses->forget();
        }
    }
}
