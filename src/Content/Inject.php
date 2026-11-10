<?php

namespace ErnestDefoe\Fanfare\Content;

use DateTimeImmutable;
use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Occasions;
use ErnestDefoe\Fanfare\People;
use ErnestDefoe\Fanfare\Wish;
use Flarum\Discussion\Discussion;
use Flarum\Frontend\Document;
use Flarum\Http\RequestUtil;
use Flarum\Post\Post;
use Flarum\User\User;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Contracts\Filesystem\Filesystem;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Puts today on the page: which occasions are on, whose day it is, and the
 * actor's own day. On a normal day nothing is added at all.
 *
 * The centrepieces, effects and tunes are one script, published to assets/
 * and added with <script defer> only when the actor has a moment to see. A
 * lazy chunk would pull webpack's chunk loader into forum.js for everyone.
 */
class Inject
{
    public const PREVIEW = 'fanfare';

    protected Filesystem $assets;

    public function __construct(
        protected Config $config,
        protected Occasions $occasions,
        protected People $people,
        protected Repository $cache,
        Factory $filesystems,
    ) {
        $this->assets = $filesystems->disk('flarum-assets');
    }

    public function __invoke(Document $document, Request $request): void
    {
        $actor = RequestUtil::getActor($request);
        $today = $this->config->today();
        $occasions = $this->occasions->around($today);
        $preview = $this->preview($actor, $request);

        if ($preview !== null) {
            $occasions = isset(Occasions::CATALOGUE[$preview['id']]) ? [$preview] : [];
        }

        $data = [];
        $moment = $occasions !== [];

        if ($forum = $preview !== null ? $this->previewForum($preview, $today) : $this->forumBirthday($today)) {
            $data['forum'] = $forum;
            $moment = true;
        }

        if ($actor->hasPermission('viewForum') && $actor->hasPermission('ernestdefoe-fanfare.viewPeople')) {
            $people = $this->people->around($today);

            if ($this->config->datlechin() && ! $actor->hasPermission('user.viewBirthday')) {
                $people['birthdays'] = [];
                $people['more']['birthdays'] = 0;
            }

            if ($people['birthdays'] || $people['anniversaries']) {
                $data['people'] = $people;

                if (! $actor->isGuest() && $actor->hasPermission('ernestdefoe-fanfare.wish')) {
                    $data['canWish'] = true;
                    $data['wished'] = $this->wished($actor, $people, $today);
                }
            }
        }

        if (! $actor->isGuest()) {
            $mine = $preview !== null
                ? ['birthday' => $preview['id'] === 'birthday', 'years' => $preview['id'] === 'anniversary' ? 3 : null]
                : $this->people->mine($actor, $today);

            if ($mine['birthday'] || $mine['years']) {
                $data['mine'] = $mine + ($preview !== null
                    ? ['md' => $today->format('m-d'), 'joined' => $today->format('m-d'), 'wishedBy' => [], 'wishedCount' => 0]
                    : ['md' => $this->people->birthdayOf($actor), 'joined' => $actor->joined_at?->format('m-d')] + $this->wishedBy($actor, $mine, $today));
                $moment = true;
            }
        }

        if (! $data && ! $occasions) {
            return;
        }

        $data['occasions'] = $occasions;
        $data['today'] = $today->format('Y-m-d');
        $data['settings'] = array_filter([
            'intensity' => $this->config->intensity(),
            'onceADay' => $this->config->onceADay(),
            'quiet' => $this->config->quietNow(),
            'preview' => $preview !== null,
        ]);

        $document->payload['fanfare'] = $data;

        if ($moment) {
            $document->foot[] = '<script defer src="'.e($this->publish(__DIR__.'/../../js/dist/stage.js')).'"></script>';
        }
    }

    /** ?fanfare=<id> lets an admin see any occasion today, or a birthday, anniversary or the forum's birthday. */
    protected function preview(User $actor, Request $request): ?array
    {
        $id = $request->getQueryParams()[self::PREVIEW] ?? null;

        if (! is_string($id) || ! $actor->isAdmin() || ! (isset(Occasions::CATALOGUE[$id]) || in_array($id, ['birthday', 'anniversary', 'forum'], true))) {
            return null;
        }

        $day = $this->config->today()->format('Y-m-d');

        // New Year previews as its eve: the countdown to tonight's midnight.
        $next = ((int) $this->config->today()->format('Y') + 1).'-01-01';

        return ['id' => $id, 'from' => $day, 'to' => $id === 'newyear' ? $next : $day, 'day' => $id === 'newyear' ? $next : $day];
    }

    /** The forum's birthday as a preview: today, with the real numbers. */
    protected function previewForum(array $preview, DateTimeImmutable $today): ?array
    {
        if ($preview['id'] !== 'forum') {
            return null;
        }

        $born = $this->config->forumBirthday() ?? User::query()->orderBy('id')->value('joined_at')?->format('Y-m-d') ?? $today->format('Y-m-d');
        $age = max(1, (int) $today->format('Y') - (int) substr($born, 0, 4));

        return [
            'md' => $today->format('m-d'),
            'age' => $age,
            'since' => $born,
        ] + $this->stats();
    }

    /** The forum's birthday, if it is around today: its age and a few numbers. Cached for the day. */
    protected function forumBirthday(DateTimeImmutable $today): ?array
    {
        return $this->cache->remember('ernestdefoe-fanfare.forum.'.$today->format('Y-m-d').'.'.$this->config->hash(), 86400, function () use ($today) {
            $born = $this->config->forumBirthday() ?? User::query()->orderBy('id')->value('joined_at')?->format('Y-m-d');

            // false, not null: the cache treats a stored null as a miss and would ask again every page.
            if (! $born || ! in_array(People::observed(substr($born, 5), (int) $today->format('Y')), People::window($today), true)) {
                return false;
            }

            $age = (int) $today->format('Y') - (int) substr($born, 0, 4);

            return $age < 1 ? false : [
                'md' => substr($born, 5),
                'age' => $age,
                'since' => $born,
            ] + $this->stats();
        }) ?: null;
    }

    /**
     * The forum's numbers for its birthday: confirmed members and what everyone can see
     * (no private or hidden discussions and posts).
     *
     * @return array{members: int, discussions: int, posts: int}
     */
    protected function stats(): array
    {
        return [
            'members' => User::query()->where('is_email_confirmed', true)->count(),
            'discussions' => Discussion::query()->whereNull('hidden_at')->where('is_private', false)->count(),
            'posts' => Post::query()->where('type', 'comment')->whereNull('hidden_at')->where('is_private', false)->count(),
        ];
    }

    /**
     * Who the actor already wished this year among the people listed.
     *
     * @param array<string, mixed> $people
     * @return list<string> "kind:id"
     */
    protected function wished(User $actor, array $people, DateTimeImmutable $today): array
    {
        // Each person's wish is filed under the year of the day they celebrate.
        $years = [];
        foreach (['birthday' => $people['birthdays'], 'anniversary' => $people['anniversaries']] as $kind => $list) {
            foreach ($list as $p) {
                $years[$kind.':'.$p['id']] = People::celebratedYear($p['md'], $today);
            }
        }

        $ids = array_unique([...array_column($people['birthdays'], 'id'), ...array_column($people['anniversaries'], 'id')]);

        return Wish::query()
            ->where('from_user_id', $actor->id)
            ->whereIn('year', array_unique(array_filter($years)))
            ->whereIn('to_user_id', $ids)
            ->get(['to_user_id', 'kind', 'year'])
            ->filter(fn (Wish $w) => ($years[$w->kind.':'.$w->to_user_id] ?? null) === $w->year)
            ->map(fn (Wish $w) => $w->kind.':'.$w->to_user_id)
            ->values()
            ->all();
    }

    /**
     * Who wished the actor on their day: a few names and a count.
     *
     * @param array{birthday: bool, years: ?int} $mine
     * @return array{wishedBy: list<string>, wishedCount: int}
     */
    protected function wishedBy(User $actor, array $mine, DateTimeImmutable $today): array
    {
        $md = ['birthday' => $mine['birthday'] ? $this->people->birthdayOf($actor) : null, 'anniversary' => $mine['years'] !== null ? $actor->joined_at?->format('m-d') : null];
        $query = Wish::query()->where('to_user_id', $actor->id)->where(function ($q) use ($md, $today) {
            foreach (array_filter($md) as $kind => $day) {
                $q->orWhere(fn ($k) => $k->where('kind', $kind)->where('year', People::celebratedYear($day, $today)));
            }
        });

        $names = (clone $query)->with('fromUser')->latest('created_at')->limit(3)->get()
            ->map(fn (Wish $w) => $w->fromUser?->display_name)->filter()->values()->all();

        return ['wishedBy' => $names, 'wishedCount' => $names ? (clone $query)->distinct()->count('from_user_id') : 0];
    }

    /**
     * Publish the stage script to assets/ under a name that changes with its
     * contents, once, the first time a page needs it; older copies are removed.
     */
    protected function publish(string $source): string
    {
        $hash = substr(md5(@filemtime($source).'-'.@filesize($source)), 0, 10);
        $dir = 'extensions/ernestdefoe-fanfare';
        $path = "$dir/stage-$hash.js";

        if (! $this->assets->exists($path)) {
            $contents = @file_get_contents($source);
            if ($contents === false || $contents === '') {
                throw new \RuntimeException("Fanfare cannot read $source");
            }

            foreach ($this->assets->files($dir) as $old) {
                if ($old !== $path && preg_match('/^stage-[0-9a-f]{10}\.js$/', basename($old))) {
                    $this->assets->delete($old);
                }
            }

            $this->assets->put($path, $contents);
        }

        return $this->assets instanceof Cloud ? $this->assets->url($path) : '/assets/'.$path;
    }
}
