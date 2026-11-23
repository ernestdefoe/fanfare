<?php

namespace ErnestDefoe\Fanfare;

use Carbon\Carbon;
use Ernestdefoe\Syllabus\Course;
use Flarum\Http\UrlGenerator;
use Flarum\User\User;
use Illuminate\Contracts\Cache\Repository;

/**
 * Course completions from Syllabus, celebrated for a few days: the student
 * gets the big moment, everyone else a line in Today's birthdays with a
 * Congratulate button.
 *
 * The last few days' completions are one cached list (forgotten when a new
 * one is recorded), so pages cost nothing until someone finishes a course.
 * Course classes are only touched while Syllabus is enabled.
 */
class Courses
{
    /** How long a completion stays on: the moment behind the header button, the line in the widget. */
    public const DAYS = 3;

    /** The newest completions kept in the cached list, and how many the widget names. */
    public const KEEP = 500;

    public const LIST = 24;

    protected const CACHE = 'ernestdefoe-fanfare.courses';

    public function __construct(
        protected Config $config,
        protected People $people,
        protected Repository $cache,
        protected UrlGenerator $url,
    ) {
    }

    /** Record a completion, once per member and course; the certificate's code links it. */
    public function record(User $user, int $courseId, string $title, ?string $code): void
    {
        Achievement::query()->insertOrIgnore([
            'user_id' => $user->id,
            'kind' => Achievement::COURSE,
            'ref_id' => $courseId,
            'title' => mb_substr($title, 0, 200),
            'code' => $code,
            'created_at' => Carbon::now(),
        ]);

        $this->cache->forget(self::CACHE);
    }

    /**
     * The actor's own completions of the last few days, newest first.
     *
     * @return list<array{id: int, title: string, url: ?string, at: string}>
     */
    public function mine(User $actor): array
    {
        if ($actor->isGuest() || ! $this->config->courses()) {
            return [];
        }

        $out = [];
        foreach ($this->recent() as $row) {
            if ($row['user'] === $actor->id) {
                $out[] = $this->present($row);
            }
        }

        return $out;
    }

    /**
     * Who finished a course lately, as the viewer may see it: members in good
     * standing who show their courses (Syllabus's own privacy choice), and only
     * courses the viewer could open themselves. The viewer's own are left out.
     *
     * @return array{list: list<array{id: int, user: int, title: string, url: ?string, at: string}>, more: int, users: array<int, array<string, mixed>>}|null
     */
    public function forViewer(User $viewer): ?array
    {
        if (! $this->config->courses() || ! $this->config->coursesPublic()) {
            return null;
        }

        $rows = array_values(array_filter($this->recent(), fn (array $r) => $r['public'] && $r['user'] !== $viewer->id));
        if (! $rows) {
            return null;
        }

        $visible = Course::query()->visibleTo($viewer)->where('status', 'published')
            ->whereIn('id', array_unique(array_column($rows, 'course')))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $rows = array_values(array_filter($rows, fn (array $r) => in_array($r['course'], $visible, true)));
        if (! $rows) {
            return null;
        }

        $shown = array_slice($rows, 0, self::LIST);
        $users = [];
        foreach ($shown as $r) {
            $users[$r['user']] = $r['profile'];
        }

        return [
            'list' => array_map(fn (array $r) => ['user' => $r['user']] + $this->present($r), $shown),
            'more' => count($rows) - count($shown),
            'users' => $users,
        ];
    }

    /**
     * The last few days' completions by listable members, newest first, with
     * whether each member shows their courses. Cached until the next one.
     *
     * @return list<array{id: int, user: int, course: int, title: string, code: ?string, at: string, public: bool, profile: array<string, mixed>}>
     */
    protected function recent(): array
    {
        return $this->cache->remember(self::CACHE, 900, function () {
            $rows = Achievement::query()
                ->where('kind', Achievement::COURSE)
                ->where('created_at', '>=', Carbon::now()->subDays(self::DAYS))
                ->whereIn('user_id', $this->people->listable(User::query())->select('users.id'))
                ->with('user')
                ->orderByDesc('created_at')->orderByDesc('id')
                ->limit(self::KEEP)
                ->get();

            $profiles = $this->people->profiles($rows->pluck('user')->filter()->unique('id')->values()->all());
            $out = [];

            foreach ($rows as $a) {
                if (! $a->user) {
                    continue;
                }

                $out[] = [
                    'id' => $a->id,
                    'user' => $a->user_id,
                    'course' => $a->ref_id,
                    'title' => $a->title,
                    'code' => $a->code,
                    'at' => $a->created_at->toIso8601String(),
                    // Syllabus's "show the courses I take on my profile" choice.
                    'public' => (bool) $a->user->getPreference('syllabusShowCourses', true),
                    'profile' => $profiles[$a->user_id],
                ];
            }

            return $out;
        });
    }

    /**
     * @param array{id: int, title: string, code: ?string, at: string} $row
     * @return array{id: int, title: string, url: ?string, at: string}
     */
    protected function present(array $row): array
    {
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            // Every certificate has a public verification page.
            'url' => $row['code'] ? $this->url->to('forum')->route('syllabus.certificate', ['code' => $row['code']]) : null,
            'at' => $row['at'],
        ];
    }

    /** A completion the actor may congratulate: recent, by a member who shows it, in a course the actor can see. */
    public function congratulable(User $actor, User $to, int $achievementId): ?Achievement
    {
        $view = $this->forViewer($actor);
        foreach ($view['list'] ?? [] as $row) {
            if ($row['id'] === $achievementId && $row['user'] === $to->id) {
                return Achievement::query()->find($achievementId);
            }
        }

        return null;
    }
}
