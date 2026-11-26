<?php

namespace ErnestDefoe\Fanfare\Api;

use ErnestDefoe\Fanfare\Birthday;
use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\People;
use Flarum\Api\Context;
use Flarum\Api\Schema;
use Flarum\User\User;

/**
 * The member's own birthday fields, seen and written only by the member and
 * moderators who can edit them. Others never get the date: the widget and
 * badges come from the day's list, which already applies the member's choice.
 *
 * With datlechin/flarum-birthdays installed its fields are used instead and
 * these stay hidden. The values live in fanfare_birthdays (the user's
 * fanfareBirthday relation), saved once after the user is.
 */
class UserFields
{
    public function __construct(protected Config $config, protected People $people)
    {
    }

    /** @return list<Schema\Attribute> */
    public function __invoke(): array
    {
        $mine = fn (User $user, Context $context) => ! $this->config->datlechin()
            && ($context->getActor()->id === $user->id || $context->getActor()->can('edit', $user));
        $read = fn (string $column) => fn (User $user) => $user->fanfareBirthday->{$column} ?? ($column === 'visibility' ? Birthday::DAY : null);

        return [
            Schema\Str::make('fanfareBirthday')
                ->get($read('md'))
                ->nullable()
                ->visible($mine)
                ->writable($mine)
                ->regex('/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/')
                ->rule(fn () => function (string $attribute, mixed $value, \Closure $fail) {
                    if (is_string($value) && ! checkdate((int) substr($value, 0, 2), (int) substr($value, 3, 2), 2000)) {
                        $fail('validation.date');
                    }
                })
                ->set(fn (User $user, ?string $value) => $this->stage($user, 'md', $value)),

            Schema\Integer::make('fanfareBirthYear')
                ->get($read('year'))
                ->nullable()
                ->visible($mine)
                ->writable($mine)
                ->min(1900)
                ->max((int) date('Y'))
                ->set(fn (User $user, ?int $value) => $this->stage($user, 'year', $value)),

            Schema\Integer::make('fanfareBirthdayVisibility')
                ->get($read('visibility'))
                ->visible($mine)
                ->writable($mine)
                ->min(0)
                ->max(2)
                ->set(fn (User $user, int $value) => $this->stage($user, 'visibility', $value)),
        ];
    }

    /**
     * Change one birthday field on the user's row (made if it isn't there yet),
     * and save the row once, after the user, however many fields changed.
     */
    protected function stage(User $user, string $column, mixed $value): void
    {
        $row = $user->fanfareBirthday;
        $first = ! $row || ! $row->isDirty();

        if (! $row) {
            $row = new Birthday();
            $row->visibility = Birthday::DAY;
            $user->setRelation('fanfareBirthday', $row);
        }

        $row->{$column} = $value;

        if ($first) {
            $user->afterSave(function (User $user) use ($row) {
                $row->user_id = $user->id;
                $row->save();
                $this->people->forget();
            });
        }
    }
}
