<?php

namespace ErnestDefoe\Fanfare\Api;

use Carbon\Carbon;
use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Notification\WishBlueprint;
use ErnestDefoe\Fanfare\People;
use ErnestDefoe\Fanfare\Wish;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\Notification\NotificationSyncer;
use Flarum\User\User;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * POST /api/fanfare/wishes {userId, kind}: one tap from the widget. Only for
 * someone whose day it is (around today, as the widget shows) and who shows
 * it; once per pair, occasion and year.
 */
class CreateWishController implements RequestHandlerInterface
{
    public function __construct(
        protected Config $config,
        protected People $people,
        protected NotificationSyncer $notifications,
        protected TranslatorInterface $translator,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();
        $actor->assertCan('ernestdefoe-fanfare.wish');
        $actor->assertCan('ernestdefoe-fanfare.viewPeople');

        $body = (array) $request->getParsedBody();
        $kind = (string) Arr::get($body, 'kind', '');
        $to = User::query()->find((int) Arr::get($body, 'userId'));
        $today = $this->config->today();

        $year = in_array($kind, Wish::KINDS, true) && $to && $to->id !== $actor->id ? $this->celebrating($to, $kind, $actor, $today) : null;

        if ($year === null) {
            throw new ValidationException(['wish' => $this->translator->trans('ernestdefoe-fanfare.api.not_their_day')]);
        }

        // Already wished: the unique key ignores the row (no error, which would abort
        // a surrounding PostgreSQL transaction). Same answer as the first time.
        $added = Wish::query()->insertOrIgnore([
            'from_user_id' => $actor->id,
            'to_user_id' => $to->id,
            'kind' => $kind,
            'year' => $year,
            'created_at' => Carbon::now(),
        ]);

        if (! $added) {
            return new JsonResponse(['wished' => true]);
        }

        $this->notifications->sync(new WishBlueprint($actor, $to->id, $kind, $year), [$to]);

        return new JsonResponse(['wished' => true], 201);
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
            : (int) $to->getAttribute('fanfare_birthday_visibility') > 0;
        $md = $this->people->birthdayOf($to);

        return $shown && $md !== null ? People::celebratedYear($md, $today) : null;
    }
}
