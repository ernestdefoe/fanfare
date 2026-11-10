<?php

namespace ErnestDefoe\Fanfare\Notification;

use Flarum\Database\AbstractModel;
use Flarum\Notification\AlertableInterface;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\User\User;

/**
 * "Mira wished you a happy birthday." The subject is the member who wished,
 * so the alert needs no resource of its own and links to their profile.
 */
class WishBlueprint implements BlueprintInterface, AlertableInterface
{
    public function __construct(public readonly User $from, public readonly string $kind, public readonly int $year)
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
        return ['kind' => $this->kind, 'year' => $this->year];
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
