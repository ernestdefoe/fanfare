<?php

namespace ErnestDefoe\Fanfare\Api;

use ErnestDefoe\Fanfare\Config;
use Flarum\Api\Schema;

/** Whether members set their birthday in Fanfare's settings (no: the Birthdays extension owns it). */
class ForumFields
{
    public function __construct(protected Config $config)
    {
    }

    /** @return list<Schema\Boolean> */
    public function __invoke(): array
    {
        return [
            Schema\Boolean::make('fanfareOwnBirthday')
                ->get(fn () => ! $this->config->datlechin()),
        ];
    }
}
