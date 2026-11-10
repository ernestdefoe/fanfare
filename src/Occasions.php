<?php

namespace ErnestDefoe\Fanfare;

use DateTimeImmutable;
use ErnestDefoe\Fanfare\Calendar\Dates;
use Illuminate\Contracts\Cache\Repository;

/**
 * The holidays Fanfare celebrates, and which of them are on around today.
 *
 * Each has a date rule (the same rule format as Festoon), how many days the
 * moment runs, and the id Festoon uses for the same holiday. With Festoon
 * installed its dates are used, overrides included, so the two never
 * disagree; without it Fanfare works them out with its own copy of Festoon's
 * calendar code.
 */
class Occasions
{
    /**
     * before: days of lead-up shown before the day (New Year's Eve), days: how
     * long it runs from the day. shift: moon-sighted, so the admin may move it.
     *
     * @var array<string, array<string, mixed>>
     */
    public const CATALOGUE = [
        'newyear' => ['rule' => ['type' => 'date', 'md' => '01-01'], 'before' => 1, 'days' => 1, 'festoon' => 'newyear', 'on' => true],
        'christmas' => ['rule' => ['type' => 'date', 'md' => '12-25'], 'before' => 1, 'days' => 1, 'festoon' => 'christmas', 'on' => true],
        'thanksgiving' => ['rule' => ['type' => 'weekday', 'month' => 11, 'weekday' => 4, 'nth' => 4], 'days' => 1, 'festoon' => 'thanksgiving', 'on' => true],
        'thanksgiving_ca' => ['rule' => ['type' => 'weekday', 'month' => 10, 'weekday' => 1, 'nth' => 2], 'days' => 1, 'on' => false],
        'halloween' => ['rule' => ['type' => 'date', 'md' => '10-31'], 'days' => 1, 'festoon' => 'halloween', 'on' => true],
        'lunar' => ['rule' => ['type' => 'chinese', 'month' => 1, 'day' => 1], 'days' => 1, 'festoon' => 'lunar', 'on' => false],
        'diwali' => ['rule' => ['type' => 'diwali'], 'days' => 1, 'festoon' => 'diwali', 'on' => false],
        'eidfitr' => ['rule' => ['type' => 'islamic', 'month' => 10, 'day' => 1], 'days' => 1, 'festoon' => 'ramadan:until', 'on' => false, 'shift' => true],
        'eidadha' => ['rule' => ['type' => 'islamic', 'month' => 12, 'day' => 10], 'days' => 1, 'on' => false, 'shift' => true],
        'hanukkah' => ['rule' => ['type' => 'hebrew', 'month' => 3, 'day' => 25], 'days' => 8, 'festoon' => 'hanukkah', 'on' => false],
    ];

    protected ?Dates $dates = null;

    protected ?object $festoonDates = null;

    public function __construct(protected Config $config, protected Repository $cache)
    {
    }

    /**
     * The occasions whose run touches yesterday, today or tomorrow in the
     * forum's timezone. Each browser then decides with its own clock, so a
     * member in Tokyo gets New Year before one in Chicago. Cached for the day.
     *
     * @return list<array{id: string, from: string, to: string, day: string}>
     */
    public function around(?DateTimeImmutable $today = null): array
    {
        $today ??= $this->config->today();
        $key = 'ernestdefoe-fanfare.around.'.$today->format('Y-m-d').'.'.$this->config->hash();

        return $this->cache->remember($key, 86400, function () use ($today) {
            $lo = $today->modify('-1 day')->format('Y-m-d');
            $hi = $today->modify('+1 day')->format('Y-m-d');
            $out = [];

            foreach ($this->config->occasions() as $id => $o) {
                if (! $o['on']) {
                    continue;
                }

                foreach ($this->runs($id, (int) $today->format('Y')) as $run) {
                    if ($run['to'] >= $lo && $run['from'] <= $hi) {
                        $out[] = ['id' => $id] + $run;
                        break;
                    }
                }
            }

            return $out;
        });
    }

    /**
     * When an occasion runs in the years around $year, after the admin's shift.
     *
     * @return list<array{from: string, to: string, day: string}>
     */
    public function runs(string $id, int $year): array
    {
        $o = self::CATALOGUE[$id] ?? null;
        if ($o === null) {
            return [];
        }

        $shift = $this->config->occasions()[$id]['shift'] ?? 0;
        $out = [];

        foreach ([$year - 1, $year, $year + 1] as $y) {
            $day = $this->date($id, $y);
            if ($day === null) {
                continue;
            }

            $day = $day->modify(($shift >= 0 ? '+' : '').$shift.' day');
            $out[] = [
                'from' => $day->modify('-'.(int) ($o['before'] ?? 0).' day')->format('Y-m-d'),
                'to' => $day->modify('+'.((int) $o['days'] - 1).' day')->format('Y-m-d'),
                'day' => $day->format('Y-m-d'),
            ];
        }

        return $out;
    }

    /** The next day each occasion falls on, for the admin page. */
    public function next(): array
    {
        $today = $this->config->today()->format('Y-m-d');
        $year = (int) substr($today, 0, 4);
        $out = [];

        foreach (array_keys(self::CATALOGUE) as $id) {
            $out[$id] = null;
            foreach ($this->runs($id, $year) as $run) {
                if ($run['to'] >= $today) {
                    $out[$id] = $run['day'];
                    break;
                }
            }
        }

        return $out;
    }

    /** The main day of an occasion in a Gregorian year, from Festoon when it is installed. */
    protected function date(string $id, int $year): ?DateTimeImmutable
    {
        $tz = $this->config->timezone();
        $rule = self::CATALOGUE[$id]['rule'];

        if ($this->config->festoon() && isset(self::CATALOGUE[$id]['festoon'])) {
            [$look, $part] = explode(':', self::CATALOGUE[$id]['festoon']) + [1 => 'date'];
            $found = resolve(\Ernestdefoe\Festoon\Config::class)->look($look)?->toArray()[$part] ?? null;

            if (is_array($found) && ($day = ($this->festoonDates ??= new \Ernestdefoe\Festoon\Calendar\Dates($tz, $this->cache))->on($found, $year))) {
                return $day;
            }
        }

        return ($this->dates ??= new Dates($tz, $this->cache))->on($rule, $year);
    }
}
