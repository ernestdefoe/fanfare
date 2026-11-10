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
use Illuminate\Database\QueryException;
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

        if (! in_array($kind, Wish::KINDS, true) || ! $to || $to->id === $actor->id || ! $this->celebrating($to, $kind, $actor, $today)) {
            throw new ValidationException(['wish' => $this->translator->trans('ernestdefoe-fanfare.api.not_their_day')]);
        }

        $year = (int) $today->format('Y');

        try {
            $wish = new Wish();
            $wish->from_user_id = $actor->id;
            $wish->to_user_id = $to->id;
            $wish->kind = $kind;
            $wish->year = $year;
            $wish->created_at = Carbon::now();
            $wish->save();
        } catch (QueryException) {
            // Already wished: the unique key said so. Same answer as the first time.
            return new JsonResponse(['wished' => true]);
        }

        $this->notifications->sync(new WishBlueprint($actor, $kind, $year), [$to]);

        return new JsonResponse(['wished' => true], 201);
    }

    /** Whether $to celebrates $kind around today and lets the actor see it. */
    protected function celebrating(User $to, string $kind, User $actor, \DateTimeImmutable $today): bool
    {
        if ($kind === 'anniversary') {
            return $to->joined_at !== null
                && in_array($to->joined_at->format('m-d'), People::window($today), true)
                && $this->people->yearsAt($to->joined_at, $today) !== null;
        }

        $shown = $this->config->datlechin()
            ? $to->getAttribute('show_birthday') && $actor->hasPermission('user.viewBirthday')
            : (int) $to->getAttribute('fanfare_birthday_visibility') > 0;

        return $shown && in_array($this->people->birthdayOf($to), People::window($today), true);
    }
}
