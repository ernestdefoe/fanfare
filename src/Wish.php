<?php

namespace ErnestDefoe\Fanfare;

use Carbon\Carbon;
use Flarum\Database\AbstractModel;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One member wishing another a happy birthday or anniversary. At most one per
 * pair, occasion and year (and course, for a course completion: a unique key),
 * so it can't be used to spam.
 *
 * @property int $id
 * @property int $from_user_id
 * @property int $to_user_id
 * @property string $kind
 * @property int $year
 * @property int $ref_id
 * @property Carbon $created_at
 * @property User|null $fromUser
 */
class Wish extends AbstractModel
{
    public const KINDS = ['birthday', 'anniversary', Achievement::COURSE];

    protected $table = 'fanfare_wishes';

    public $timestamps = false;

    protected $casts = ['created_at' => 'datetime', 'year' => 'integer', 'ref_id' => 'integer'];

    /** @return BelongsTo<User, $this> */
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }
}
