<?php

namespace ErnestDefoe\Fanfare\Calendar;

/**
 * Where the sun and moon are, to about a minute of arc.
 *
 * Diwali falls on the new moon (amavasya) that ends the month of Ashvin, in
 * the Hindu lunisolar calendar, and no calendar ICU ships can say when that
 * is. Nowruz starts with the March equinox, which ICU's Persian calendar only
 * approximates with a 33-year cycle. The formulas are the abridged series from Jean Meeus,
 * "Astronomical Algorithms", chapters 25 and 47 — good to a few minutes of
 * time for the moon, which is plenty to place a tithi on the right evening.
 */
final class Astronomy
{
    /** Julian centuries since J2000.0 for a Unix timestamp. */
    public static function centuries(int $timestamp): float
    {
        return ($timestamp / 86400 + 2440587.5 - 2451545.0) / 36525;
    }

    /** The sun's apparent ecliptic longitude, degrees. */
    public static function sun(float $t): float
    {
        $l0 = 280.46646 + 36000.76983 * $t + 0.0003032 * $t * $t;
        $m = deg2rad(357.52911 + 35999.05029 * $t - 0.0001537 * $t * $t);
        $c = (1.914602 - 0.004817 * $t - 0.000014 * $t * $t) * sin($m)
            + (0.019993 - 0.000101 * $t) * sin(2 * $m)
            + 0.000289 * sin(3 * $m);
        $omega = deg2rad(125.04 - 1934.136 * $t);

        return self::wrap($l0 + $c - 0.00569 - 0.00478 * sin($omega));
    }

    /** The moon's ecliptic longitude, degrees. */
    public static function moon(float $t): float
    {
        $lp = 218.3164477 + 481267.88123421 * $t - 0.0015786 * $t * $t;
        $d = 297.8501921 + 445267.1114034 * $t - 0.0018819 * $t * $t;
        $m = 357.5291092 + 35999.0502909 * $t - 0.0001536 * $t * $t;
        $mp = 134.9633964 + 477198.8675055 * $t + 0.0087414 * $t * $t;
        $f = 93.2720950 + 483202.0175233 * $t - 0.0036539 * $t * $t;
        $e = 1 - 0.002516 * $t - 0.0000074 * $t * $t;

        // [D, M, M', F, coefficient in millionths of a degree]
        static $terms = [
            [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618],
            [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066],
            [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
            [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980],
            [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
            [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
            [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689],
            [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390], [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236],
            [0, 1, 2, 0, -2120], [0, 2, 0, 0, -2069],
        ];

        $sum = 0.0;
        foreach ($terms as [$td, $tm, $tmp, $tf, $coef]) {
            $arg = deg2rad($td * $d + $tm * $m + $tmp * $mp + $tf * $f);
            $sum += $coef * sin($arg) * ($tm === 0 ? 1 : $e ** abs($tm));
        }

        $a1 = deg2rad(119.75 + 131.849 * $t);
        $a2 = deg2rad(53.09 + 479264.290 * $t);
        $sum += 3958 * sin($a1) + 1962 * sin(deg2rad($lp - $f)) + 318 * sin($a2);

        return self::wrap($lp + $sum / 1e6);
    }

    /** How far the moon is ahead of the sun: 0 at new moon, 180 at full. */
    public static function elongation(int $timestamp): float
    {
        $t = self::centuries($timestamp);

        return self::wrap(self::moon($t) - self::sun($t));
    }

    /**
     * The next new moon at or after $timestamp, to within a few seconds:
     * Newton's method on the elongation, the moon gaining about 12.19° a day.
     */
    public static function newMoonAfter(int $timestamp): int
    {
        $ts = (float) $timestamp;

        for ($i = 0; $i < 8; $i++) {
            $gap = 360 - self::elongation((int) round($ts));
            if ($gap > 350 && $i > 0) {
                $gap -= 360; // stepped just past it
            }
            $ts += $gap / 12.190749 * 86400;
            if (abs($gap) < 0.0001) {
                break;
            }
        }

        return (int) round($ts);
    }

    /**
     * The March equinox of a year — the moment the sun's apparent longitude
     * reaches 0° — to within a minute or two. Newton's method again, the sun
     * moving about 0.9856° a day.
     */
    public static function marchEquinox(int $year): int
    {
        $ts = (float) gmmktime(12, 0, 0, 3, 20, $year);

        for ($i = 0; $i < 6; $i++) {
            $gap = self::wrap(180 - self::sun(self::centuries((int) round($ts)))) - 180;
            $ts += $gap / 0.985647 * 86400;
            if (abs($gap) < 0.00001) {
                break;
            }
        }

        return (int) round($ts);
    }

    /** The Lahiri ayanamsa: the gap between tropical and sidereal longitude. */
    public static function ayanamsa(int $timestamp): float
    {
        return 23.853 + self::centuries($timestamp) * 1.3969;
    }

    public static function wrap(float $deg): float
    {
        $deg = fmod($deg, 360);

        return $deg < 0 ? $deg + 360 : $deg;
    }
}
