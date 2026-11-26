<?php

use Illuminate\Database\Schema\Builder;

/**
 * Copy what members set (a birthday, a year, or a visibility other than the
 * default) from the three users columns into fanfare_birthdays, in chunks.
 * The columns themselves are dropped by the next migration; down() copies
 * back while they exist again.
 */
return [
    'up' => function (Builder $schema) {
        if (! $schema->hasColumn('users', 'fanfare_birthday')) {
            return;
        }

        $db = $schema->getConnection();
        $db->table('users')
            ->select(['id', 'fanfare_birthday', 'fanfare_birth_year', 'fanfare_birthday_visibility'])
            ->where(fn ($q) => $q->whereNotNull('fanfare_birthday')->orWhereNotNull('fanfare_birth_year')->orWhere('fanfare_birthday_visibility', '!=', 1))
            ->orderBy('id')
            ->chunk(500, function ($users) use ($db) {
                $db->table('fanfare_birthdays')->insertOrIgnore($users->map(fn ($u) => [
                    'user_id' => $u->id,
                    'md' => $u->fanfare_birthday,
                    'year' => $u->fanfare_birth_year,
                    'visibility' => $u->fanfare_birthday_visibility ?? 1,
                ])->all());
            });
    },
    'down' => function (Builder $schema) {
        if (! $schema->hasColumn('users', 'fanfare_birthday')) {
            return;
        }

        $db = $schema->getConnection();
        $db->table('fanfare_birthdays')->orderBy('user_id')->chunk(500, function ($rows) use ($db) {
            foreach ($rows as $r) {
                $db->table('users')->where('id', $r->user_id)->update([
                    'fanfare_birthday' => $r->md,
                    'fanfare_birth_year' => $r->year,
                    'fanfare_birthday_visibility' => $r->visibility,
                ]);
            }
        });
    },
];
