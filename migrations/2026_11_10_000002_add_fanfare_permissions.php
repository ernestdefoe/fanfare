<?php

use Flarum\Database\Migration;
use Flarum\Group\Group;

return Migration::addPermissions([
    'ernestdefoe-fanfare.viewPeople' => Group::MEMBER_ID,
    'ernestdefoe-fanfare.wish' => Group::MEMBER_ID,
]);
