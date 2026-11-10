<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

// Nullable, all of them: flarum/gdpr sets every column it doesn't know to null
// when it anonymizes a member.
return [
    'up' => function (Builder $schema) {
        $schema->table('users', function (Blueprint $table) {
            // MM-DD, so the daily lookup is a plain indexed IN().
            $table->char('fanfare_birthday', 5)->nullable()->index();
            $table->unsignedSmallInteger('fanfare_birth_year')->nullable();
            // 0 hidden (greeted privately, never listed), 1 the day, 2 the day and age.
            $table->unsignedTinyInteger('fanfare_birthday_visibility')->nullable()->default(1);
        });
    },
    'down' => function (Builder $schema) {
        $schema->table('users', function (Blueprint $table) {
            $table->dropIndex(['fanfare_birthday']);
            $table->dropColumn(['fanfare_birthday', 'fanfare_birth_year', 'fanfare_birthday_visibility']);
        });
    },
];
