<?php

namespace ErnestDefoe\Fanfare\Notification;

use Flarum\Database\AbstractModel;
use Flarum\Notification\AlertableInterface;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\User\User;

/**
 * The forum's own greeting on a member's day: "Happy birthday!" or "4 years
 * on Lakeside today". Keyed by year so a second run the same day finds the
 * alert already there.
 */
class DayBlueprint implements BlueprintInterface, AlertableInterface
{
    public function __construct(public readonly User $user, public readonly string $kind, public readonly int $year, public readonly ?int $years = null)
    {
    }

    public function getFromUser(): ?User
    {
        return null;
    }

    public function getSubject(): ?AbstractModel
    {
        return $this->user;
    }

    public function getData(): array
    {
        return array_filter(['kind' => $this->kind, 'year' => $this->year, 'years' => $this->years]);
    }

    public static function getType(): string
    {
        return 'fanfareDay';
    }

    public static function getSubjectModel(): string
    {
        return User::class;
    }
}
