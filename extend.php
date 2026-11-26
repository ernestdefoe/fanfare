<?php

/*
 * Fanfare for Flarum 2: the forum marks the moment. Free and MIT licensed.
 *
 * Member birthdays and join anniversaries, the forum's own birthday, the
 * year's holidays, Festoon's own days and Syllabus course completions, each
 * with a big centrepiece that rises onto the screen, a tune to tap and play,
 * and one-click wishes. On a normal day the page carries nothing; the
 * centrepieces are one script added only on a day with a moment.
 */

use ErnestDefoe\Fanfare\Api\ForumFields;
use ErnestDefoe\Fanfare\Api\Resource\WishResource;
use ErnestDefoe\Fanfare\Birthday;
use ErnestDefoe\Fanfare\Api\UserFields;
use ErnestDefoe\Fanfare\Console\GreetCommand;
use ErnestDefoe\Fanfare\Content\AdminPayload;
use ErnestDefoe\Fanfare\Content\Inject;
use ErnestDefoe\Fanfare\Extend\With;
use ErnestDefoe\Fanfare\Gdpr\FanfareData;
use ErnestDefoe\Fanfare\Listener\ForgetCourseList;
use ErnestDefoe\Fanfare\Listener\RecordCourseCompletion;
use ErnestDefoe\Fanfare\Notification\DayBlueprint;
use ErnestDefoe\Fanfare\Notification\WishBlueprint;
use ErnestDefoe\Fanfare\Provider;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\ForumResource;
use Flarum\Api\Resource\UserResource;
use Flarum\Extend;
use Flarum\Gdpr\Extend\UserData;
use Flarum\User\Event\Saving;
use Flarum\User\User;
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

    new Extend\ApiResource(WishResource::class),

    (new Extend\ApiResource(UserResource::class))
        ->fields(UserFields::class)
        // The birthday fields read the fanfare_birthdays row: one query per list, not per member.
        ->endpoint(['index', 'show'], fn (Endpoint\Index|Endpoint\Show $endpoint) => $endpoint->eagerLoad('fanfareBirthday')),

    (new Extend\Model(User::class))
        ->hasOne('fanfareBirthday', Birthday::class, 'user_id'),

    (new Extend\ApiResource(ForumResource::class))
        ->fields(ForumFields::class),

    (new Extend\Notification())
        ->type(WishBlueprint::class, ['alert'])
        ->type(DayBlueprint::class, ['alert']),

    // Literal keys: extend.php is read during deploys, when a class may not load yet.
    (new Extend\Settings())
        ->default('ernestdefoe-fanfare.intensity', 'festive')
        ->default('ernestdefoe-fanfare.once_a_day', true)
        ->default('ernestdefoe-fanfare.milestones', false)
        ->default('ernestdefoe-fanfare.courses', true)
        ->default('ernestdefoe-fanfare.courses_public', true),

    // A member's own switches. Sound defaults on so ♪ Play works; nothing ever
    // plays without a tap, and turning it off is remembered on every device.
    (new Extend\User())
        ->registerPreference('fanfareSound', fn ($value) => (bool) $value, true)
        ->registerPreference('fanfareEffects', fn ($value) => (bool) $value, true)
        ->registerPreference('fanfareSeen', fn ($value) => substr((string) $value, 0, 64), '')
        // The newest course completion whose moment already opened by itself.
        ->registerPreference('fanfareCourseSeen', fn ($value) => max(0, (int) $value), 0),

    (new Extend\Console())
        ->command(GreetCommand::class)
        ->schedule(GreetCommand::class, function (Event $event) {
            $event->hourly();
        }),

    (new Extend\ServiceProvider())
        ->register(Provider::class),

    // The extensions Fanfare works with, each only while it is enabled.
    (new Extend\Conditional())
        ->whenExtensionEnabled('ernestdefoe-syllabus', fn () => [
            new With('syllabus'),
            // Course completions, confirmed by Syllabus.
            (new Extend\Event())
                ->listen(\Ernestdefoe\Syllabus\Event\CourseCompleted::class, RecordCourseCompletion::class)
                ->listen(Saving::class, ForgetCourseList::class),
        ])
        ->whenExtensionEnabled('ernestdefoe-festoon', fn () => [new With('festoon')])
        ->whenExtensionEnabled('datlechin-birthdays', fn () => [new With('datlechin')])
        ->whenExtensionEnabled('flarum-suspend', fn () => [new With('suspend')])
        ->whenExtensionEnabled('flarum-gdpr', fn () => [
            (new UserData())->addType(FanfareData::class),
        ]),
];
