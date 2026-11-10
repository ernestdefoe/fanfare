<?php

namespace ErnestDefoe\Fanfare\Console;

use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Notification\DayBlueprint;
use ErnestDefoe\Fanfare\People;
use Flarum\Notification\NotificationSyncer;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Illuminate\Console\Command;

/**
 * The forum's own greeting, once a day: an alert to each member whose
 * birthday or join anniversary it is in the forum's timezone. Runs hourly and
 * does its work on the first run after midnight, so a forum in Sydney is not
 * greeted at UTC midnight. With datlechin/flarum-birthdays installed, that
 * extension greets birthdays and Fanfare only anniversaries.
 */
class GreetCommand extends Command
{
    protected $signature = 'fanfare:greet';

    protected $description = 'Send Fanfare\'s birthday and anniversary greetings for today.';

    public function handle(Config $config, People $people, NotificationSyncer $notifications, SettingsRepositoryInterface $settings): int
    {
        $today = $config->today();
        $key = Config::P.'greeted';

        if ($settings->get($key) === $today->format('Y-m-d')) {
            return self::SUCCESS;
        }

        $year = (int) $today->format('Y');
        $md = $today->format('m-d');
        $mds = $md === '02-28' && $today->format('L') === '0' ? ['02-28', '02-29'] : [$md];
        $sent = 0;

        if (! $config->datlechin()) {
            $people->listable(User::query())->whereIn('fanfare_birthday', $mds)
                ->chunkById(200, function ($users) use ($notifications, $year, &$sent) {
                    foreach ($users as $user) {
                        $notifications->sync(new DayBlueprint($user, 'birthday', $year), [$user]);
                        $sent++;
                    }
                });
        }

        $query = $people->listable(User::query())->where('joined_at', '<', $today->modify('-300 days')->format('Y-m-d'));
        $query->whereIn(People::monthDay($query->getQuery(), 'users.joined_at'), $mds)
            ->chunkById(200, function ($users) use ($notifications, $people, $today, $year, &$sent) {
                foreach ($users as $user) {
                    if ($years = $people->yearsAt($user->joined_at, $today)) {
                        $notifications->sync(new DayBlueprint($user, 'anniversary', $year, $years), [$user]);
                        $sent++;
                    }
                }
            });

        // Marked done only once everyone was greeted: a run that dies part-way is
        // finished by the next one, and the syncer doesn't send an alert twice.
        $settings->set($key, $today->format('Y-m-d'));
        $this->info("Greeted $sent.");

        return self::SUCCESS;
    }
}
