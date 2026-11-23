<?php

namespace ErnestDefoe\Fanfare\Notification;

use Flarum\Database\AbstractModel;
use Flarum\Notification\AlertableInterface;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\User\User;

/**
 * "Mira wished you a happy birthday", or congratulated you on finishing a
 * course (its id and title ride in the data). The subject is the member who wished,
 * so the alert needs no resource of its own and links to their profile.
 *
 * The recipient is in the data: the syncer matches alerts by type, subject
 * and data, and without it Mira wishing Carol would delete Bob's alert.
 */
class WishBlueprint implements BlueprintInterface, AlertableInterface
{
    public function __construct(
        public readonly User $from,
        public readonly int $to,
        public readonly string $kind,
        public readonly int $year,
        public readonly int $ref = 0,
        public readonly ?string $title = null,
    )
    {
    }

    public function getFromUser(): ?User
    {
        return $this->from;
    }

    public function getSubject(): ?AbstractModel
    {
        return $this->from;
    }

    public function getData(): array
    {
        return ['to' => $this->to, 'kind' => $this->kind, 'year' => $this->year] + ($this->ref ? ['ref' => $this->ref, 'title' => $this->title] : []);
    }

    public static function getType(): string
    {
        return 'fanfareWish';
    }

    public static function getSubjectModel(): string
    {
        return User::class;
    }
}
