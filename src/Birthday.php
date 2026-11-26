<?php

namespace ErnestDefoe\Fanfare;

use Flarum\Database\AbstractModel;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A member's birthday and who may see it, beside the users table rather than
 * in it. No row means no birthday set and the default visibility (members see
 * the day).
 *
 * @property int $user_id
 * @property string|null $md MM-DD
 * @property int|null $year
 * @property int $visibility 0 hidden (greeted privately, never listed, join anniversary hidden too), 1 the day, 2 the day and age
 */
class Birthday extends AbstractModel
{
    public const HIDDEN = 0;
    public const DAY = 1;
    public const DAY_AND_AGE = 2;

    protected $table = 'fanfare_birthdays';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $casts = ['user_id' => 'integer', 'year' => 'integer', 'visibility' => 'integer'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
