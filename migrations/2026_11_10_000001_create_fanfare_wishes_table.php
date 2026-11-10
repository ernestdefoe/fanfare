<?php

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

return Migration::createTable('fanfare_wishes', function (Blueprint $table) {
    $table->increments('id');
    $table->unsignedInteger('from_user_id');
    $table->unsignedInteger('to_user_id');
    $table->string('kind', 16);
    $table->unsignedSmallInteger('year');
    $table->dateTime('created_at');

    // One wish per member, per friend, per occasion, per year.
    $table->unique(['from_user_id', 'to_user_id', 'kind', 'year']);
    $table->index(['to_user_id', 'year']);
    $table->foreign('from_user_id')->references('id')->on('users')->cascadeOnDelete();
    $table->foreign('to_user_id')->references('id')->on('users')->cascadeOnDelete();
});
