<?php

namespace ErnestDefoe\Fanfare;

use DateTimeImmutable;
use DateTimeZone;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Container\Container;

/**
 * Fanfare's settings, read once per request and cleaned.
 */
class Config
{
    public const P = 'ernestdefoe-fanfare.';
    public const OCCASIONS = self::P.'occasions';
    public const INTENSITY = self::P.'intensity';
    public const ONCE_A_DAY = self::P.'once_a_day';
    public const QUIET_FROM = self::P.'quiet_from';
    public const QUIET_TO = self::P.'quiet_to';
    public const FORUM_BIRTHDAY = self::P.'forum_birthday';
    public const MILESTONES = self::P.'milestones';
    public const TIMEZONE = self::P.'timezone';
    public const COURSES = self::P.'courses';
    public const COURSES_PUBLIC = self::P.'courses_public';

    public const INTENSITIES = ['subtle', 'festive', 'full'];
    public const MILESTONE_YEARS = [1, 5, 10, 15, 20, 25, 30];

    /**
     * Worked out once per settings value: Config is a singleton, and a queue
     * worker lives through many setting changes.
     *
     * @var array{0: string, 1: array<string, array{on: bool, shift: int}>}|null
     */
    protected ?array $occasions = null;

    /** @var array{0: string, 1: array<string, array{name: string, emoji: string, primary: string, secondary: string, from: string, to: string}>}|null */
    protected ?array $custom = null;

    /** Set by extend.php's Extend\Conditional blocks, one per extension Fanfare works with. */
    public const WITH = 'ernestdefoe-fanfare.with.';

    public function __construct(protected SettingsRepositoryInterface $settings, protected Container $container)
    {
    }

    /** Whether an extension Fanfare works with is enabled: festoon, datlechin, syllabus or suspend. */
    protected function with(string $name): bool
    {
        return $this->container->bound(self::WITH.$name);
    }

    public function festoon(): bool
    {
        return $this->with('festoon');
    }

    public function datlechin(): bool
    {
        return $this->with('datlechin');
    }

    public function syllabus(): bool
    {
        return $this->with('syllabus');
    }

    /** Course completions are celebrated: Syllabus is on and the admin hasn't turned them off. */
    public function courses(): bool
    {
        return $this->syllabus() && (bool) $this->settings->get(self::COURSES);
    }

    /** Other members see who finished a course (the student always gets their own moment). */
    public function coursesPublic(): bool
    {
        return (bool) $this->settings->get(self::COURSES_PUBLIC);
    }

    public function suspend(): bool
    {
        return $this->with('suspend');
    }

    /**
     * The forum's timezone: Fanfare's own setting, else Festoon's (so the two
     * change over at the same midnight), else the server's.
     */
    public function timezone(): DateTimeZone
    {
        $tz = (string) $this->settings->get(self::TIMEZONE);

        if ($tz === '' && $this->festoon()) {
            $tz = $this->container->make(\Ernestdefoe\Festoon\Config::class)->timezone();
        }

        return new DateTimeZone(in_array($tz, timezone_identifiers_list(), true) ? $tz : date_default_timezone_get());
    }

    public function today(): DateTimeImmutable
    {
        return new DateTimeImmutable('today', $this->timezone());
    }

    /**
     * Per-occasion overrides: on or off, and a shift of a day either way for
     * moon-sighted dates. Festoon's own days follow the built-in ones, on
     * unless the admin turned one off here.
     *
     * @return array<string, array{on: bool, shift: int}>
     */
    public function occasions(): array
    {
        $raw = (string) $this->settings->get(self::OCCASIONS);
        $days = $this->festoonDays();
        $key = $raw.'|'.implode(',', array_keys($days));

        if ($this->occasions !== null && $this->occasions[0] === $key) {
            return $this->occasions[1];
        }

        $stored = json_decode($raw, true);
        $out = [];

        foreach (Occasions::CATALOGUE as $id => $o) {
            $row = is_array($stored[$id] ?? null) ? $stored[$id] : [];
            $out[$id] = [
                'on' => (bool) ($row['on'] ?? $o['on']),
                'shift' => ($o['shift'] ?? false) ? max(-1, min(1, (int) ($row['shift'] ?? 0))) : 0,
            ];
        }

        foreach (array_keys($days) as $id) {
            $row = is_array($stored[$id] ?? null) ? $stored[$id] : [];
            $out[$id] = ['on' => (bool) ($row['on'] ?? true), 'shift' => 0];
        }

        return ($this->occasions = [$key, $out])[1];
    }

    /**
     * The days an admin made in Festoon (Festoon → Your own looks) and left
     * switched on there: a name, an emoji, two colors and a run of dates.
     *
     * @return array<string, array{name: string, emoji: string, primary: string, secondary: string, from: string, to: string}>
     */
    public function festoonDays(): array
    {
        if (! $this->festoon()) {
            return [];
        }

        $key = $this->settings->get('ernestdefoe-festoon.custom').'|'.$this->settings->get('ernestdefoe-festoon.looks');
        if ($this->custom !== null && $this->custom[0] === $key) {
            return $this->custom[1];
        }

        $out = [];

        foreach ($this->container->make(\Ernestdefoe\Festoon\Config::class)->looks() as $id => $look) {
            $date = $look->date();

            if ($look->group() !== 'custom' || ! $look->enabled() || ($date['type'] ?? '') !== 'range') {
                continue;
            }

            $out[$id] = [
                'name' => $look->name(),
                'emoji' => $look->get('emoji'),
                'primary' => $look->get('primary'),
                'secondary' => $look->get('secondary'),
                'from' => (string) $date['from'],
                'to' => (string) $date['to'],
            ];
        }

        return ($this->custom = [$key, $out])[1];
    }

    public function intensity(): string
    {
        $v = (string) $this->settings->get(self::INTENSITY);

        return in_array($v, self::INTENSITIES, true) ? $v : 'festive';
    }

    public function onceADay(): bool
    {
        return (bool) $this->settings->get(self::ONCE_A_DAY);
    }

    public function milestonesOnly(): bool
    {
        return (bool) $this->settings->get(self::MILESTONES);
    }

    /** Quiet hours, in the forum's timezone: no bursts and nothing that moves. */
    public function quietNow(): bool
    {
        $from = $this->hhmm(self::QUIET_FROM);
        $to = $this->hhmm(self::QUIET_TO);

        if ($from === null || $to === null || $from === $to) {
            return false;
        }

        $now = (new DateTimeImmutable('now', $this->timezone()))->format('H:i');

        return $from < $to ? ($now >= $from && $now < $to) : ($now >= $from || $now < $to);
    }

    /** The forum's birthday as Y-m-d, or null to use the day the first member joined. */
    public function forumBirthday(): ?string
    {
        $v = (string) $this->settings->get(self::FORUM_BIRTHDAY);

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
    }

    /** A fingerprint of everything that changes what today looks like. */
    public function hash(): string
    {
        // Festoon's looks carry the admin's date overrides, and its own days live beside them.
        $festoon = $this->festoon() ? $this->settings->get('ernestdefoe-festoon.looks').$this->settings->get('ernestdefoe-festoon.custom') : '';

        return substr(md5(json_encode([$this->occasions(), $this->forumBirthday(), $this->milestonesOnly(), $festoon, $this->datlechin(), $this->suspend(), $this->timezone()->getName()]) ?: ''), 0, 8);
    }

    protected function hhmm(string $key): ?string
    {
        $v = (string) $this->settings->get($key, '');

        return preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $v) ? $v : null;
    }
}
