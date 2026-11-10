<?php

namespace ErnestDefoe\Fanfare;

use DateTimeImmutable;
use DateTimeZone;
use Flarum\Extension\ExtensionManager;
use Flarum\Settings\SettingsRepositoryInterface;

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

    public const INTENSITIES = ['subtle', 'festive', 'full'];
    public const MILESTONE_YEARS = [1, 5, 10, 15, 20, 25, 30];

    /** @var array<string, array{on: bool, shift: int}>|null */
    protected ?array $occasions = null;

    public function __construct(protected SettingsRepositoryInterface $settings, protected ExtensionManager $extensions)
    {
    }

    public function festoon(): bool
    {
        return $this->extensions->isEnabled('ernestdefoe-festoon') && class_exists(\Ernestdefoe\Festoon\Config::class);
    }

    public function datlechin(): bool
    {
        return $this->extensions->isEnabled('datlechin-birthdays');
    }

    public function suspend(): bool
    {
        return $this->extensions->isEnabled('flarum-suspend');
    }

    /**
     * The forum's timezone: Fanfare's own setting, else Festoon's (so the two
     * change over at the same midnight), else the server's.
     */
    public function timezone(): DateTimeZone
    {
        $tz = (string) $this->settings->get(self::TIMEZONE, '');

        if ($tz === '' && $this->festoon()) {
            $tz = resolve(\Ernestdefoe\Festoon\Config::class)->timezone();
        }

        return new DateTimeZone(in_array($tz, timezone_identifiers_list(), true) ? $tz : date_default_timezone_get());
    }

    public function today(): DateTimeImmutable
    {
        return new DateTimeImmutable('today', $this->timezone());
    }

    /**
     * Per-occasion overrides: on or off, and a shift of a day either way for
     * moon-sighted dates.
     *
     * @return array<string, array{on: bool, shift: int}>
     */
    public function occasions(): array
    {
        if ($this->occasions !== null) {
            return $this->occasions;
        }

        $stored = json_decode((string) $this->settings->get(self::OCCASIONS, ''), true);
        $out = [];

        foreach (Occasions::CATALOGUE as $id => $o) {
            $row = is_array($stored[$id] ?? null) ? $stored[$id] : [];
            $out[$id] = [
                'on' => (bool) ($row['on'] ?? $o['on']),
                'shift' => ($o['shift'] ?? false) ? max(-1, min(1, (int) ($row['shift'] ?? 0))) : 0,
            ];
        }

        return $this->occasions = $out;
    }

    public function intensity(): string
    {
        $v = (string) $this->settings->get(self::INTENSITY, 'festive');

        return in_array($v, self::INTENSITIES, true) ? $v : 'festive';
    }

    public function onceADay(): bool
    {
        return (bool) $this->settings->get(self::ONCE_A_DAY, true);
    }

    public function milestonesOnly(): bool
    {
        return (bool) $this->settings->get(self::MILESTONES, false);
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
        $v = (string) $this->settings->get(self::FORUM_BIRTHDAY, '');

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
    }

    /** A fingerprint of everything that changes what today looks like. */
    public function hash(): string
    {
        // Festoon's looks carry the admin's date overrides, which change Festoon-sourced dates.
        $festoon = $this->festoon() ? (string) $this->settings->get('ernestdefoe-festoon.looks', '') : '';

        return substr(md5(json_encode([$this->occasions(), $this->forumBirthday(), $this->milestonesOnly(), $festoon, $this->datlechin(), $this->suspend(), $this->timezone()->getName()]) ?: ''), 0, 8);
    }

    protected function hhmm(string $key): ?string
    {
        $v = (string) $this->settings->get($key, '');

        return preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $v) ? $v : null;
    }
}
