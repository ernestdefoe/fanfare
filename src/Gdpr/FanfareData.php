<?php

namespace ErnestDefoe\Fanfare\Gdpr;

use ErnestDefoe\Fanfare\Achievement;
use ErnestDefoe\Fanfare\Birthday;
use ErnestDefoe\Fanfare\Wish;
use Flarum\Gdpr\Data\Type;

/**
 * A member's Fanfare data: their birthday, the courses they were celebrated
 * for, and the wishes they sent and received. Erasing removes all of it.
 */
class FanfareData extends Type
{
    public static function exportDescription(): string
    {
        return self::staticTranslator()->trans('ernestdefoe-fanfare.lib.gdpr.export');
    }

    public static function anonymizeDescription(): string
    {
        return self::deleteDescription();
    }

    public static function deleteDescription(): string
    {
        return self::staticTranslator()->trans('ernestdefoe-fanfare.lib.gdpr.delete');
    }

    public function export(): ?array
    {
        $id = $this->user->id;

        return [[
            'fanfare/birthday.json' => $this->encodeForExport(Birthday::query()->where('user_id', $id)->get(['md', 'year', 'visibility'])->toArray()),
            'fanfare/celebrated.json' => $this->encodeForExport(Achievement::query()->where('user_id', $id)->get(['kind', 'title', 'created_at'])->toArray()),
            'fanfare/wishes.json' => $this->encodeForExport([
                'sent' => Wish::query()->where('from_user_id', $id)->get(['kind', 'year', 'created_at'])->toArray(),
                'received' => Wish::query()->where('to_user_id', $id)->get(['kind', 'year', 'created_at'])->toArray(),
            ]),
        ]];
    }

    public function anonymize(): void
    {
        $this->delete();
    }

    public function delete(): void
    {
        $id = $this->user->id;

        Birthday::query()->where('user_id', $id)->delete();
        Achievement::query()->where('user_id', $id)->delete();
        Wish::query()->where('from_user_id', $id)->orWhere('to_user_id', $id)->delete();
    }
}
