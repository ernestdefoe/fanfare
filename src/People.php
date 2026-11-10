<?php

namespace ErnestDefoe\Fanfare;

use Carbon\Carbon;
use DateTimeImmutable;
use DateTimeInterface;
use Flarum\Http\SlugManager;
use Flarum\User\User;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Query\Expression;
use Illuminate\Database\Query\Grammars;
use RuntimeException;

/**
 * Whose birthday and join anniversary falls around today.
 *
 * Birthdays come from Fanfare's own fields, or from datlechin/flarum-birthdays
 * when that is installed (its field, its privacy choices). Two queries and one
 * user lookup, cached for fifteen minutes, whatever the traffic.
 */
class People
{
    /** How many of each kind the widget lists by name; the rest are a count. */
    public const LIST = 24;

    public function __construct(protected Config $config, protected Repository $cache, protected SlugManager $slugs)
    {
    }

    /**
     * @return array{birthdays: list<array{id: int, md: string, age: ?int}>, anniversaries: list<array{id: int, md: string, years: int}>, more: array{birthdays: int, anniversaries: int}, users: array<int, array<string, mixed>>}
     */
    public function around(?DateTimeImmutable $today = null): array
    {
        $today ??= $this->config->today();
        $key = 'ernestdefoe-fanfare.people.'.$today->format('Y-m-d').'.'.$this->config->hash();

        return $this->cache->remember($key, 900, fn () => $this->find($today));
    }

    public function forget(?DateTimeImmutable $today = null): void
    {
        $today ??= $this->config->today();
        $this->cache->forget('ernestdefoe-fanfare.people.'.$today->format('Y-m-d').'.'.$this->config->hash());
    }

    /**
     * Month-days from yesterday to tomorrow. Members born on February 29
     * celebrate on the 28th in other years.
     *
     * @return list<string>
     */
    public static function window(DateTimeImmutable $today): array
    {
        $days = [];

        foreach (['-1 day', 'today', '+1 day'] as $step) {
            $day = $today->modify($step);
            $days[] = $day->format('m-d');

            if ($day->format('m-d') === '02-28' && $day->format('L') === '0') {
                $days[] = '02-29';
            }
        }

        return $days;
    }

    /** The day a member celebrates a month-day on in a given year. */
    public static function observed(string $md, int $year): string
    {
        return $md === '02-29' && ! checkdate(2, 29, $year) ? '02-28' : $md;
    }

    /**
     * Members the day's lists may show: confirmed, and not suspended right now.
     *
     * @param Builder<User> $query
     * @return Builder<User>
     */
    public function listable(Builder $query): Builder
    {
        $query->where('users.is_email_confirmed', true);

        if ($this->config->suspend()) {
            $query->where(fn (Builder $q) => $q->whereNull('users.suspended_until')->orWhere('users.suspended_until', '<=', Carbon::now()));
        }

        return $query;
    }

    public function isListable(User $user): bool
    {
        if (! $user->is_email_confirmed) {
            return false;
        }

        $until = $this->config->suspend() ? $user->getAttribute('suspended_until') : null;

        return ! $until || Carbon::parse($until)->lte(Carbon::now());
    }

    /** Whether a member lets others see their join anniversary: "nobody" on their birthday hides it too. */
    public function anniversaryShown(User $user): bool
    {
        if ($this->config->datlechin()) {
            return true;
        }

        $v = $user->getAttribute('fanfare_birthday_visibility');

        return $v === null || (int) $v > 0;
    }

    /**
     * The year of the day a month-day is celebrated on, within yesterday to tomorrow,
     * so a Dec 31 birthday seen on Jan 1 belongs to last year. Null when it isn't in the window.
     */
    public static function celebratedYear(string $md, DateTimeImmutable $today): ?int
    {
        foreach (['-1 day', 'today', '+1 day'] as $step) {
            $day = $today->modify($step);
            $year = (int) $day->format('Y');

            if (self::observed($md, $year) === $day->format('m-d')) {
                return $year;
            }
        }

        return null;
    }

    /** A month-day expression for a date column, for each database Flarum runs on. */
    public static function monthDay(QueryBuilder $query, string $column): Expression
    {
        $grammar = $query->getGrammar();
        $wrapped = $grammar->wrap($column);

        return new Expression(match (true) {
            $grammar instanceof Grammars\SQLiteGrammar => "strftime('%m-%d', $wrapped)",
            $grammar instanceof Grammars\PostgresGrammar => "to_char($wrapped, 'MM-DD')",
            $grammar instanceof Grammars\MySqlGrammar => "date_format($wrapped, '%m-%d')",
            default => throw new RuntimeException('Unsupported database grammar: '.$grammar::class),
        });
    }

    /**
     * The actor's own day: their birthday whatever they chose to show, and how
     * many years they have been a member.
     *
     * @return array{birthday: bool, years: ?int}
     */
    public function mine(User $actor, ?DateTimeImmutable $today = null): array
    {
        $today ??= $this->config->today();
        $mds = self::window($today);
        $md = $this->birthdayOf($actor);
        $years = null;

        if ($actor->joined_at instanceof DateTimeInterface && in_array($actor->joined_at->format('m-d'), $mds, true)) {
            $years = $this->yearsAt($actor->joined_at, $today);
        }

        return ['birthday' => $md !== null && in_array($md, $mds, true), 'years' => $years];
    }

    public function birthdayOf(User $user): ?string
    {
        if ($this->config->datlechin()) {
            $b = $user->getAttribute('birthday');

            return $b ? Carbon::parse($b)->format('m-d') : null;
        }

        $md = $user->getAttribute('fanfare_birthday');

        return is_string($md) && preg_match('/^\d{2}-\d{2}$/', $md) ? $md : null;
    }

    /** Whole years since joining, counted at the anniversary nearest today; null if not one to celebrate. */
    public function yearsAt(DateTimeInterface $joined, DateTimeImmutable $today): ?int
    {
        $years = (int) $today->format('Y') - (int) $joined->format('Y');

        // Around New Year the window holds last year's last day or next year's first.
        if ($joined->format('m') === '12' && $today->format('m') === '01') {
            $years--;
        } elseif ($joined->format('m') === '01' && $today->format('m') === '12') {
            $years++;
        }

        if ($years < 1 || ($this->config->milestonesOnly() && ! in_array($years, Config::MILESTONE_YEARS, true))) {
            return null;
        }

        return $years;
    }

    /** @return array<string, mixed> */
    protected function find(DateTimeImmutable $today): array
    {
        $mds = self::window($today);
        [$birthdays, $moreB] = $this->birthdays($mds, $today);
        [$anniversaries, $moreA] = $this->anniversaries($mds, $today);

        $ids = array_unique([...array_column($birthdays, 'id'), ...array_column($anniversaries, 'id')]);
        $users = [];

        if ($ids) {
            foreach (User::query()->whereIn('id', $ids)->get() as $user) {
                $users[$user->id] = [
                    'username' => $user->username,
                    'name' => $user->display_name,
                    'avatar' => $user->avatar_url,
                    'slug' => $this->slugs->forResource(User::class)->toSlug($user),
                ];
            }
        }

        return ['birthdays' => $birthdays, 'anniversaries' => $anniversaries, 'more' => ['birthdays' => $moreB, 'anniversaries' => $moreA], 'users' => $users];
    }

    /**
     * @param list<string> $mds
     * @return array{0: list<array{id: int, md: string, age: ?int}>, 1: int}
     */
    protected function birthdays(array $mds, DateTimeImmutable $today): array
    {
        $query = $this->listable(User::query());

        if ($this->config->datlechin()) {
            $query->where('show_birthday', true)
                ->whereIn(self::monthDay($query->getQuery(), 'users.birthday'), $mds);
            $rows = $this->take($query, ['id', 'birthday', 'show_age']);
            $list = array_map(function (User $u) use ($today) {
                $born = Carbon::parse($u->getAttribute('birthday'));

                return ['id' => (int) $u->id, 'md' => $born->format('m-d'), 'age' => $u->getAttribute('show_age') ? $this->age((int) $born->format('Y'), $born->format('m-d'), $today) : null];
            }, $rows[0]);
        } else {
            $query->where('fanfare_birthday_visibility', '>', 0)->whereIn('fanfare_birthday', $mds);
            $rows = $this->take($query, ['id', 'fanfare_birthday', 'fanfare_birth_year', 'fanfare_birthday_visibility']);
            $list = array_map(fn (User $u) => [
                'id' => (int) $u->id,
                'md' => (string) $u->getAttribute('fanfare_birthday'),
                'age' => (int) $u->getAttribute('fanfare_birthday_visibility') === 2 && $u->getAttribute('fanfare_birth_year')
                    ? $this->age((int) $u->getAttribute('fanfare_birth_year'), (string) $u->getAttribute('fanfare_birthday'), $today)
                    : null,
            ], $rows[0]);
        }

        return [$list, $rows[1]];
    }

    /**
     * @param list<string> $mds
     * @return array{0: list<array{id: int, md: string, years: int}>, 1: int}
     */
    protected function anniversaries(array $mds, DateTimeImmutable $today): array
    {
        $query = $this->listable(User::query())
            ->where('joined_at', '<', $today->modify('-300 days')->format('Y-m-d'));
        $query->whereIn(self::monthDay($query->getQuery(), 'users.joined_at'), $mds);

        if (! $this->config->datlechin()) {
            $query->where(fn (Builder $q) => $q->whereNull('fanfare_birthday_visibility')->orWhere('fanfare_birthday_visibility', '>', 0));
        }

        [$rows, $more] = $this->take($query, ['id', 'joined_at']);
        $list = [];

        foreach ($rows as $u) {
            $years = $this->yearsAt($u->joined_at, $today);
            if ($years !== null) {
                $list[] = ['id' => (int) $u->id, 'md' => $u->joined_at->format('m-d'), 'years' => $years];
            }
        }

        return [$list, $more];
    }

    /**
     * The first LIST members, and how many more there are.
     *
     * @param Builder<User> $query
     * @param list<string> $columns
     * @return array{0: list<User>, 1: int}
     */
    protected function take(Builder $query, array $columns): array
    {
        $rows = (clone $query)->orderBy('id')->limit(self::LIST + 1)->get($columns)->all();
        $more = count($rows) > self::LIST ? (clone $query)->count() - self::LIST : 0;

        return [array_slice($rows, 0, self::LIST), $more];
    }

    protected function age(int $year, string $md, DateTimeImmutable $today): ?int
    {
        // The birthday in the window may be yesterday's or tomorrow's, across a year end.
        $y = (int) $today->format('Y');
        if ($md === '12-31' && $today->format('m-d') === '01-01') {
            $y--;
        } elseif ($md === '01-01' && $today->format('m-d') === '12-31') {
            $y++;
        }
        $age = $y - $year;

        return $age > 0 && $age < 130 ? $age : null;
    }
}
