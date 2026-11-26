<?php

namespace ErnestDefoe\Fanfare\Api\Resource;

use ErnestDefoe\Fanfare\Achievement;
use ErnestDefoe\Fanfare\Birthday;
use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Courses;
use ErnestDefoe\Fanfare\Notification\WishBlueprint;
use ErnestDefoe\Fanfare\People;
use ErnestDefoe\Fanfare\Wish;
use Carbon\Carbon;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Flarum\Foundation\ValidationException;
use Flarum\Notification\NotificationSyncer;
use Flarum\User\User;
use Symfony\Contracts\Translation\TranslatorInterface;
use Tobyz\JsonApiServer\Context as OriginalContext;

/**
 * Wishes (type `fanfare-wishes`): one tap from the widget, create only.
 * {kind, userId, achievementId?}. Only for someone whose day it is (around
 * today, as the widget shows) and who shows it, or who finished a course lately
 * that the actor can see; once per pair, occasion and year (and course). A
 * second wish answers like the first and sends nothing.
 *
 * @extends AbstractDatabaseResource<Wish>
 */
class WishResource extends AbstractDatabaseResource
{
    public function __construct(
        protected Config $config,
        protected People $people,
        protected Courses $courses,
        protected NotificationSyncer $notifications,
        protected TranslatorInterface $translator,
    ) {
    }

    public function type(): string
    {
        return 'fanfare-wishes';
    }

    public function model(): string
    {
        return Wish::class;
    }

    public function endpoints(): array
    {
        return [
            Endpoint\Create::make()
                ->authenticated()
                ->can('ernestdefoe-fanfare.wish')
                ->can('ernestdefoe-fanfare.viewPeople'),
        ];
    }

    public function fields(): array
    {
        return [
            Schema\Str::make('kind')
                ->requiredOnCreate()
                ->writableOnCreate()
                ->in(Wish::KINDS),
            Schema\Integer::make('userId')
                ->requiredOnCreate()
                ->writableOnCreate()
                ->property('to_user_id'),
            // The course completion a Congratulate is for.
            Schema\Integer::make('achievementId')
                ->nullable()
                ->writableOnCreate()
                ->property('ref_id'),
            Schema\Integer::make('year'),
        ];
    }

    /** @param Wish $model */
    public function create(object $model, OriginalContext $context): object
    {
        $actor = $context->getActor();
        $to = User::query()->find($model->to_user_id);
        [$year, $achievement] = $to && $to->id !== $actor->id ? $this->celebrated($to, $model->kind, (int) $model->ref_id, $actor) : [null, null];

        if ($year === null) {
            throw new ValidationException(['wish' => $this->translator->trans('ernestdefoe-fanfare.api.not_their_day')]);
        }

        $ref = $achievement ? $achievement->id : 0;
        $keys = ['from_user_id' => $actor->id, 'to_user_id' => $to->id, 'kind' => $model->kind, 'year' => $year, 'ref_id' => $ref];

        // Already wished: the unique key ignores the row (no error, which would abort
        // a surrounding PostgreSQL transaction), and the existing wish is the answer.
        $added = Wish::query()->insertOrIgnore($keys + ['created_at' => Carbon::now()]);
        $wish = Wish::query()->where($keys)->firstOrFail();

        if ($added) {
            $this->notifications->sync(new WishBlueprint($actor, $to->id, $model->kind, $year, $ref, $achievement?->title), [$to]);
        }

        return $wish;
    }

    /**
     * The year a wish is filed under, and the course completion for a Congratulate,
     * or [null, null] when $to doesn't celebrate $kind now, for this actor.
     *
     * @return array{0: ?int, 1: ?Achievement}
     */
    protected function celebrated(User $to, string $kind, int $ref, User $actor): array
    {
        if ($kind === Achievement::COURSE) {
            $achievement = $this->courses->congratulable($actor, $to, $ref);

            return $achievement ? [(int) $achievement->created_at->format('Y'), $achievement] : [null, null];
        }

        return [$this->celebrating($to, $kind, $actor, $this->config->today()), null];
    }

    /**
     * The year of the occasion when $to celebrates $kind around today, shows it
     * to the actor and is a member in good standing; null otherwise. The wish is
     * filed under that year, so a member wished on New Year's Eve in one
     * timezone can't be wished again on New Year's Day in another.
     */
    protected function celebrating(User $to, string $kind, User $actor, \DateTimeImmutable $today): ?int
    {
        if (! $this->people->isListable($to)) {
            return null;
        }

        if ($kind === 'anniversary') {
            if ($to->joined_at === null || ! $this->people->anniversaryShown($to) || $this->people->yearsAt($to->joined_at, $today) === null) {
                return null;
            }

            return People::celebratedYear($to->joined_at->format('m-d'), $today);
        }

        $shown = $this->config->datlechin()
            ? $to->getAttribute('show_birthday') && $actor->hasPermission('user.viewBirthday')
            : ($to->fanfareBirthday->visibility ?? Birthday::DAY) > Birthday::HIDDEN;
        $md = $this->people->birthdayOf($to);

        return $shown && $md !== null ? People::celebratedYear($md, $today) : null;
    }
}
