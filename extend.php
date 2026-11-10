<?php

/*
 * Fanfare for Flarum 2: the forum marks the moment. Free and MIT licensed.
 *
 * Member birthdays and join anniversaries, the forum's own birthday and the
 * year's holidays, each with a big centrepiece that rises onto the screen, a
 * tune to tap and play, and one-click wishes. On a normal day the page carries
 * nothing; the centrepieces are one script added only on a day with a moment.
 */

use ErnestDefoe\Fanfare\Api\CreateWishController;
use ErnestDefoe\Fanfare\Api\UserFields;
use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Console\GreetCommand;
use ErnestDefoe\Fanfare\Content\AdminPayload;
use ErnestDefoe\Fanfare\Content\Inject;
use ErnestDefoe\Fanfare\Notification\DayBlueprint;
use ErnestDefoe\Fanfare\Notification\WishBlueprint;
use ErnestDefoe\Fanfare\Provider;
use Flarum\Api\Resource\ForumResource;
use Flarum\Api\Resource\UserResource;
use Flarum\Api\Schema;
use Flarum\Extend;
use Flarum\Gdpr\Extend\UserData;
use Illuminate\Console\Scheduling\Event;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less')
        ->content(Inject::class),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less')
        ->content(AdminPayload::class),

    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\Routes('api'))
        ->post('/fanfare/wishes', 'fanfare.wishes.create', CreateWishController::class),

    (new Extend\ApiResource(UserResource::class))
        ->fields(UserFields::class),

    // Whether members set their birthday in Fanfare's settings (no: the Birthdays extension owns it).
    (new Extend\ApiResource(ForumResource::class))
        ->fields(fn () => [
            Schema\Boolean::make('fanfareOwnBirthday')
                ->get(fn () => ! resolve(Config::class)->datlechin()),
        ]),

    (new Extend\Notification())
        ->type(WishBlueprint::class, ['alert'])
        ->type(DayBlueprint::class, ['alert']),

    // Literal keys: extend.php is read during deploys, when a class may not load yet.
    (new Extend\Settings())
        ->default('ernestdefoe-fanfare.intensity', 'festive')
        ->default('ernestdefoe-fanfare.once_a_day', true)
        ->default('ernestdefoe-fanfare.milestones', false),

    // A member's own switches. Sound defaults on so ♪ Play works; nothing ever
    // plays without a tap, and turning it off is remembered on every device.
    (new Extend\User())
        ->registerPreference('fanfareSound', fn ($value) => (bool) $value, true)
        ->registerPreference('fanfareEffects', fn ($value) => (bool) $value, true)
        ->registerPreference('fanfareSeen', fn ($value) => substr((string) $value, 0, 64), ''),

    (new Extend\Console())
        ->command(GreetCommand::class)
        ->schedule(GreetCommand::class, function (Event $event) {
            $event->hourly();
        }),

    (new Extend\ServiceProvider())
        ->register(Provider::class),

    (new Extend\Conditional())
        ->whenExtensionEnabled('flarum-gdpr', fn () => [
            (new UserData())->addPiiKeysForSerialization(['fanfare_birthday', 'fanfare_birth_year']),
        ]),
];
