<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

/**
 * A member can finish two courses in one year, so a wish is also filed under
 * what it congratulates (ref_id: 0 for birthdays and anniversaries, not null,
 * so the unique key still holds on PostgreSQL and SQLite).
 *
 * The old unique key is found by its columns, not its name (installs before
 * 1.0.0 have Laravel's generated one), and the new key is added before the old
 * one goes: MySQL won't drop an index a foreign key still leans on.
 */
$unique = function (Builder $schema, array $columns): ?string {
    foreach ($schema->getIndexes('fanfare_wishes') as $index) {
        if ($index['unique'] && ! $index['primary'] && $index['columns'] === $columns) {
            return $index['name'];
        }
    }

    return null;
};

return [
    'up' => function (Builder $schema) use ($unique) {
        $prefix = $schema->getConnection()->getTablePrefix();
        $old = $unique($schema, ['from_user_id', 'to_user_id', 'kind', 'year']);

        if (! $schema->hasColumn('fanfare_wishes', 'ref_id')) {
            $schema->table('fanfare_wishes', function (Blueprint $table) {
                $table->unsignedInteger('ref_id')->default(0);
            });
        }

        $schema->table('fanfare_wishes', function (Blueprint $table) use ($prefix, $old) {
            $table->unique(['from_user_id', 'to_user_id', 'kind', 'year', 'ref_id'], $prefix.'fanfare_wishes_ref_unique');

            if ($old !== null) {
                $table->dropUnique($old);
            }
        });
    },
    'down' => function (Builder $schema) use ($unique) {
        $prefix = $schema->getConnection()->getTablePrefix();
        $new = $unique($schema, ['from_user_id', 'to_user_id', 'kind', 'year', 'ref_id']);

        $schema->table('fanfare_wishes', function (Blueprint $table) use ($prefix, $new) {
            $table->unique(['from_user_id', 'to_user_id', 'kind', 'year'], $prefix.'fanfare_wishes_pair_unique');

            if ($new !== null) {
                $table->dropUnique($new);
            }
        });

        $schema->table('fanfare_wishes', function (Blueprint $table) {
            $table->dropColumn('ref_id');
        });
    },
];
