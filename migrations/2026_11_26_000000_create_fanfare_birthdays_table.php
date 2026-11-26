<?php

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

/**
 * Members' birthdays, beside the users table instead of in it (they were three
 * users columns until 1.2). md is MM-DD, so the daily lookup is an indexed IN().
 */
return Migration::createTable('fanfare_birthdays', function (Blueprint $table) {
    $table->unsignedInteger('user_id')->primary();
    $table->char('md', 5)->nullable()->index();
    $table->unsignedSmallInteger('year')->nullable();
    // 0 hidden (greeted privately, never listed), 1 the day, 2 the day and age.
    $table->unsignedTinyInteger('visibility')->default(1);

    $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
});
