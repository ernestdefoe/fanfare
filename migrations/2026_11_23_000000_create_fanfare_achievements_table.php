<?php

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

/**
 * What members achieved in other extensions, celebrated for a few days: a
 * Syllabus course they completed (ref_id is the course). The title is kept as
 * it was on the day, like a certificate: a renamed course doesn't rewrite it.
 */
return Migration::createTable('fanfare_achievements', function (Blueprint $table) {
    $table->increments('id');
    $table->unsignedInteger('user_id');
    $table->string('kind', 16);
    $table->unsignedInteger('ref_id');
    $table->string('title', 200);
    $table->string('code', 64)->nullable();
    $table->dateTime('created_at');

    // One row per member and course, ever (Syllabus fires the event once, too).
    $table->unique(['user_id', 'kind', 'ref_id']);
    $table->index('created_at');
    $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
});
