<?php

namespace ErnestDefoe\Fanfare;

use Carbon\Carbon;
use Flarum\Database\AbstractModel;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Something a member achieved in another extension, celebrated for a few days:
 * a Syllabus course they completed. One row per member and course, ever.
 *
 * @property int $id
 * @property int $user_id
 * @property string $kind
 * @property int $ref_id
 * @property string $title
 * @property string|null $code
 * @property Carbon $created_at
 * @property User|null $user
 */
class Achievement extends AbstractModel
{
    public const COURSE = 'course';

    protected $table = 'fanfare_achievements';

    public $timestamps = false;

    protected $casts = ['created_at' => 'datetime', 'ref_id' => 'integer', 'user_id' => 'integer'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
