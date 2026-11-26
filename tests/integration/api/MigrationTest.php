<?php

namespace ErnestDefoe\Fanfare\Tests\integration\api;

use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use Flarum\User\User;
use PHPUnit\Framework\Attributes\Test;

/**
 * 1.2 moves birthdays from three users columns into fanfare_birthdays. This
 * runs the real migrations both ways on whatever database the suite uses.
 */
class MigrationTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('ernestdefoe-fanfare');
        $this->prepareDatabase([
            User::class => [
                $this->normalUser(),
                ['id' => 3, 'username' => 'mira', 'email' => 'mira@machine.local', 'is_email_confirmed' => 1],
                ['id' => 4, 'username' => 'quiet', 'email' => 'quiet@machine.local', 'is_email_confirmed' => 1],
                ['id' => 5, 'username' => 'plain', 'email' => 'plain@machine.local', 'is_email_confirmed' => 1],
            ],
        ]);
    }

    /** Schema changes commit MySQL's test transaction, so what this test made is removed by hand. */
    protected function tearDown(): void
    {
        $this->database()->table('fanfare_birthdays')->delete();
        $this->database()->table('users')->whereIn('id', [3, 4, 5])->delete();

        parent::tearDown();
    }

    protected function migration(string $name): array
    {
        return require __DIR__.'/../../../migrations/'.$name.'.php';
    }

    #[Test]
    public function birthdays_move_off_the_users_table_and_back()
    {
        $schema = $this->database()->getSchemaBuilder();
        $move = $this->migration('2026_11_26_000001_move_fanfare_birthdays_off_users');
        $drop = $this->migration('2026_11_26_000002_drop_fanfare_birthday_from_users');
        $db = $this->database();

        // As a 1.1 forum: the columns, with what members set.
        $drop['down']($schema);
        $db->table('users')->where('id', 3)->update(['fanfare_birthday' => '02-29', 'fanfare_birth_year' => 1990, 'fanfare_birthday_visibility' => 2]);
        $db->table('users')->where('id', 4)->update(['fanfare_birthday_visibility' => 0]);

        $move['up']($schema);
        $drop['up']($schema);

        $rows = $db->table('fanfare_birthdays')->orderBy('user_id')->get(['user_id', 'md', 'year', 'visibility'])->map(fn ($r) => (array) $r)->all();
        $this->assertEquals([
            ['user_id' => 3, 'md' => '02-29', 'year' => 1990, 'visibility' => 2],
            ['user_id' => 4, 'md' => null, 'year' => null, 'visibility' => 0],
        ], $rows, 'only members who set something get a row; the default visibility needs none');
        $this->assertFalse($schema->hasColumn('users', 'fanfare_birthday'));

        // And back, for a rollback.
        $drop['down']($schema);
        $move['down']($schema);
        $this->assertSame('02-29', $db->table('users')->where('id', 3)->value('fanfare_birthday'));
        $this->assertSame(0, (int) $db->table('users')->where('id', 4)->value('fanfare_birthday_visibility'));
        $drop['up']($schema);
    }
}
