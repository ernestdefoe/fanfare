<?php

namespace ErnestDefoe\Fanfare\Api;

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
 * these stay hidden.
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
        $forget = fn (User $user) => $user->afterSave(fn () => $this->people->forget());

        return [
            Schema\Str::make('fanfareBirthday')
                ->property('fanfare_birthday')
                ->nullable()
                ->visible($mine)
                ->writable($mine)
                ->regex('/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/')
                ->rule(fn () => function (string $attribute, mixed $value, \Closure $fail) {
                    if (is_string($value) && ! checkdate((int) substr($value, 0, 2), (int) substr($value, 3, 2), 2000)) {
                        $fail('validation.date');
                    }
                })
                ->set(function (User $user, ?string $value) use ($forget) {
                    $user->setAttribute('fanfare_birthday', $value);
                    $forget($user);
                }),

            Schema\Integer::make('fanfareBirthYear')
                ->property('fanfare_birth_year')
                ->nullable()
                ->visible($mine)
                ->writable($mine)
                ->min(1900)
                ->max((int) date('Y'))
                ->set(function (User $user, ?int $value) use ($forget) {
                    $user->setAttribute('fanfare_birth_year', $value);
                    $forget($user);
                }),

            Schema\Integer::make('fanfareBirthdayVisibility')
                ->property('fanfare_birthday_visibility')
                ->visible($mine)
                ->writable($mine)
                ->min(0)
                ->max(2)
                ->set(function (User $user, int $value) use ($forget) {
                    $user->setAttribute('fanfare_birthday_visibility', $value);
                    $forget($user);
                }),
        ];
    }
}
