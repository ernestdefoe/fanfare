<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

/** The users columns, now copied into fanfare_birthdays. down() brings them back for the copy-back. */
return [
    'up' => function (Builder $schema) {
        if (! $schema->hasColumn('users', 'fanfare_birthday')) {
            return;
        }

        $schema->table('users', function (Blueprint $table) {
            $table->dropIndex(['fanfare_birthday']);
            $table->dropColumn(['fanfare_birthday', 'fanfare_birth_year', 'fanfare_birthday_visibility']);
        });
    },
    'down' => function (Builder $schema) {
        $schema->table('users', function (Blueprint $table) {
            $table->char('fanfare_birthday', 5)->nullable()->index();
            $table->unsignedSmallInteger('fanfare_birth_year')->nullable();
            $table->unsignedTinyInteger('fanfare_birthday_visibility')->nullable()->default(1);
        });
    },
];
