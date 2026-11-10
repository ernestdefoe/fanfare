<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        // The generated name for the unique key is 55 characters before the
        // table prefix, too close to MySQL's 64. This one is short and still
        // carries the prefix, so two forums sharing a database don't collide.
        $prefix = $schema->getConnection()->getTablePrefix();

        $schema->create('fanfare_wishes', function (Blueprint $table) use ($prefix) {
            $table->increments('id');
            $table->unsignedInteger('from_user_id');
            $table->unsignedInteger('to_user_id');
            $table->string('kind', 16);
            $table->unsignedSmallInteger('year');
            $table->dateTime('created_at');

            // One wish per member, per friend, per occasion, per year.
            $table->unique(['from_user_id', 'to_user_id', 'kind', 'year'], $prefix.'fanfare_wishes_pair_unique');
            $table->index(['to_user_id', 'year']);
            $table->foreign('from_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('to_user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('fanfare_wishes');
    },
];
