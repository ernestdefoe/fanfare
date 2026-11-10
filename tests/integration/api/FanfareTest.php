<?php

namespace ErnestDefoe\Fanfare\Tests\integration\api;

use DateTimeImmutable;
use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Occasions;
use ErnestDefoe\Fanfare\People;
use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use Flarum\User\User;
use PHPUnit\Framework\Attributes\Test;

/**
 * The day's people and occasions as the page carries them, the wish button,
 * and the member's own fields.
 */
class FanfareTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    protected string $md;

    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('ernestdefoe-fanfare');
        $this->md = (new DateTimeImmutable('today', new \DateTimeZone(date_default_timezone_get())))->format('m-d');
        $joined = (new DateTimeImmutable('today'))->modify('-3 years')->format('Y-m-d 12:00:00');
        $other = $this->md === '06-15' ? '07-15' : '06-15';

        $this->prepareDatabase([
            User::class => [
                $this->normalUser(),
                ['id' => 3, 'username' => 'mira', 'email' => 'mira@machine.local', 'is_email_confirmed' => 1, 'joined_at' => '2020-01-01', 'fanfare_birthday' => $this->md, 'fanfare_birth_year' => 1995, 'fanfare_birthday_visibility' => 2],
                ['id' => 4, 'username' => 'quiet', 'email' => 'quiet@machine.local', 'is_email_confirmed' => 1, 'joined_at' => '2020-01-01', 'fanfare_birthday' => $this->md, 'fanfare_birthday_visibility' => 0],
                ['id' => 5, 'username' => 'tobi', 'email' => 'tobi@machine.local', 'is_email_confirmed' => 1, 'joined_at' => $joined],
                ['id' => 7, 'username' => 'nora', 'email' => 'nora@machine.local', 'is_email_confirmed' => 1, 'joined_at' => '2020-01-01', 'fanfare_birthday' => $this->md, 'fanfare_birthday_visibility' => 1],
                ['id' => 8, 'username' => 'hermit', 'email' => 'hermit@machine.local', 'is_email_confirmed' => 1, 'joined_at' => $joined, 'fanfare_birthday_visibility' => 0],
                ['id' => 9, 'username' => 'unconfirmed', 'email' => 'unconfirmed@machine.local', 'is_email_confirmed' => 0, 'joined_at' => '2020-01-01', 'fanfare_birthday' => $this->md, 'fanfare_birthday_visibility' => 1],
                ['id' => 6, 'username' => 'later', 'email' => 'later@machine.local', 'is_email_confirmed' => 1, 'joined_at' => '2020-01-01', 'fanfare_birthday' => $other, 'fanfare_birthday_visibility' => 1],
            ],
            'group_user' => array_map(fn ($id) => ['user_id' => $id, 'group_id' => 3], [3, 4, 5, 6, 7, 8, 9]),
        ]);

        // Holidays off, so "a normal day" doesn't depend on the date the tests run.
        $this->setting(Config::OCCASIONS, json_encode(array_map(fn () => ['on' => false], Occasions::CATALOGUE)));
    }

    /** The fanfare payload of the forum page, or null. */
    protected function payload(?int $as): ?array
    {
        $html = $this->send($this->request('GET', '/', $as ? ['authenticatedAs' => $as] : []))->getBody()->getContents();
        $at = strpos($html, '"fanfare":{');

        if ($at === false) {
            return null;
        }

        // The object that follows, by matching braces outside strings.
        $start = $at + strlen('"fanfare":');
        $depth = 0;
        $in = false;
        for ($i = $start; $i < strlen($html); $i++) {
            $c = $html[$i];
            if ($in) {
                if ($c === '\\') {
                    $i++;
                } elseif ($c === '"') {
                    $in = false;
                }
            } elseif ($c === '"') {
                $in = true;
            } elseif ($c === '{') {
                $depth++;
            } elseif ($c === '}' && --$depth === 0) {
                return json_decode(substr($html, $start, $i - $start + 1), true);
            }
        }

        return null;
    }

    #[Test]
    public function members_see_whose_day_it_is_but_not_hidden_birthdays()
    {
        $data = $this->payload(2);

        $this->assertNotNull($data);
        $ids = array_column($data['people']['birthdays'], 'id');
        $this->assertContains(3, $ids);
        $this->assertNotContains(4, $ids, 'a hidden birthday is never listed');
        $this->assertNotContains(6, $ids);
        $this->assertSame(31 + ((int) date('Y') - 2026), $data['people']['birthdays'][array_search(3, $ids)]['age']);
        $this->assertSame([5], array_column($data['people']['anniversaries'], 'id'), '"nobody" hides the join anniversary too');
        $this->assertNotContains(9, $ids, 'unconfirmed members are not listed');
        $this->assertSame(3, $data['people']['anniversaries'][0]['years']);
        $this->assertTrue($data['canWish']);
    }

    #[Test]
    public function guests_see_nothing_by_default()
    {
        $this->assertNull($this->payload(null));
    }

    #[Test]
    public function a_hidden_birthday_still_greets_its_owner()
    {
        $data = $this->payload(4);

        $this->assertTrue($data['mine']['birthday']);
        $this->assertStringContainsString('stage-', $this->send($this->request('GET', '/', ['authenticatedAs' => 4]))->getBody()->getContents());
    }

    #[Test]
    public function wishing_once_notifies_and_twice_does_not()
    {
        $wish = fn () => $this->send($this->request('POST', '/api/fanfare/wishes', ['authenticatedAs' => 2, 'json' => ['userId' => 3, 'kind' => 'birthday']]));

        $this->assertSame(201, $wish()->getStatusCode());
        $this->assertSame(200, $wish()->getStatusCode());
        $this->assertSame(1, $this->database()->table('fanfare_wishes')->count());
        $this->assertSame(1, $this->database()->table('notifications')->where('type', 'fanfareWish')->where('user_id', 3)->count());

        // A second person wished: both keep their alert.
        $this->assertSame(201, $this->send($this->request('POST', '/api/fanfare/wishes', ['authenticatedAs' => 2, 'json' => ['userId' => 7, 'kind' => 'birthday']]))->getStatusCode());
        foreach ([3, 7] as $to) {
            $this->assertSame(1, $this->database()->table('notifications')->where('type', 'fanfareWish')->where('user_id', $to)->where('is_deleted', false)->count(), "alert for $to");
        }

        $this->assertContains('birthday:3', $this->payload(2)['wished']);
    }

    #[Test]
    public function you_cannot_wish_someone_whose_day_it_is_not_or_who_hides_it()
    {
        foreach ([[6, 'birthday'], [4, 'birthday'], [2, 'birthday'], [3, 'anniversary'], [3, 'nonsense'], [8, 'anniversary'], [9, 'birthday']] as [$to, $kind]) {
            $response = $this->send($this->request('POST', '/api/fanfare/wishes', ['authenticatedAs' => 2, 'json' => ['userId' => $to, 'kind' => $kind]]));
            $this->assertSame(422, $response->getStatusCode(), "$to $kind");
        }

        $this->assertContains($this->send($this->request('POST', '/api/fanfare/wishes', ['json' => ['userId' => 3, 'kind' => 'birthday']]))->getStatusCode(), [400, 401]);
    }

    #[Test]
    public function members_set_their_own_birthday_and_only_they_see_it()
    {
        $patch = fn (string $md) => $this->send($this->request('PATCH', '/api/users/2', [
            'authenticatedAs' => 2,
            'json' => ['data' => ['type' => 'users', 'id' => '2', 'attributes' => ['fanfareBirthday' => $md, 'fanfareBirthdayVisibility' => 1]]],
        ]));

        $this->assertSame(422, $patch('13-01')->getStatusCode());
        $this->assertSame(422, $patch('02-30')->getStatusCode());
        $this->assertSame(200, $patch('02-29')->getStatusCode());
        $this->assertSame('02-29', User::find(2)->fanfare_birthday);

        $seen = json_decode($this->send($this->request('GET', '/api/users/3', ['authenticatedAs' => 2]))->getBody()->getContents(), true);
        $this->assertArrayNotHasKey('fanfareBirthday', $seen['data']['attributes']);
    }

    #[Test]
    public function a_normal_day_adds_nothing_and_costs_nothing_extra()
    {
        $this->database()->table('users')->update(['fanfare_birthday' => null, 'joined_at' => (new DateTimeImmutable('today'))->modify('-40 days')->format('Y-m-d')]);

        $this->assertNull($this->payload(2));
    }

    #[Test]
    public function the_forums_birthday_counts_only_what_everyone_can_see()
    {
        $this->setting(Config::FORUM_BIRTHDAY, ((int) date('Y') - 6).'-'.$this->md);
        $this->database()->table('discussions')->insert([
            ['id' => 1, 'title' => 'Open', 'slug' => 'open', 'comment_count' => 1, 'participant_count' => 1, 'created_at' => '2026-01-01', 'user_id' => 2, 'is_private' => 0],
            ['id' => 2, 'title' => 'Private', 'slug' => 'private', 'comment_count' => 1, 'participant_count' => 1, 'created_at' => '2026-01-01', 'user_id' => 2, 'is_private' => 1],
        ]);
        $this->database()->table('posts')->insert([
            ['id' => 1, 'discussion_id' => 1, 'number' => 1, 'created_at' => '2026-01-01', 'user_id' => 2, 'type' => 'comment', 'content' => '<t>Hi</t>', 'is_private' => 0],
            ['id' => 2, 'discussion_id' => 2, 'number' => 1, 'created_at' => '2026-01-01', 'user_id' => 2, 'type' => 'comment', 'content' => '<t>Secret</t>', 'is_private' => 1],
        ]);

        $forum = $this->payload(2)['forum'];

        $this->assertSame(6, $forum['age']);
        $this->assertSame(1, $forum['discussions']);
        $this->assertSame(1, $forum['posts']);
    }

    #[Test]
    public function without_view_forum_nobody_is_listed()
    {
        $this->database()->table('group_permission')->where('permission', 'viewForum')->delete();

        $this->assertArrayNotHasKey('people', $this->payload(2) ?? []);
    }

    #[Test]
    public function a_wish_belongs_to_the_year_of_the_day_celebrated()
    {
        $this->assertSame(2026, People::celebratedYear('12-31', new DateTimeImmutable('2027-01-01')));
        $this->assertSame(2027, People::celebratedYear('01-01', new DateTimeImmutable('2026-12-31')));
        $this->assertSame(2027, People::celebratedYear('02-29', new DateTimeImmutable('2027-02-28')));
        $this->assertNull(People::celebratedYear('06-15', new DateTimeImmutable('2027-02-28')));
    }

    #[Test]
    public function holiday_dates_are_right()
    {
        $occasions = $this->app()->getContainer()->make(Occasions::class);
        $day = fn (string $id, int $year) => array_values(array_filter($occasions->runs($id, $year), fn ($r) => str_starts_with($r['day'], (string) $year)))[0]['day'] ?? null;

        $this->assertSame('2026-12-25', $day('christmas', 2026));
        $this->assertSame('2026-11-26', $day('thanksgiving', 2026));
        $this->assertSame('2026-10-12', $day('thanksgiving_ca', 2026));
        $this->assertSame('2027-02-06', $day('lunar', 2027));
        $this->assertSame('2026-11-08', $day('diwali', 2026));
        $this->assertSame('2026-12-05', $day('hanukkah', 2026));
        // Umm al-Qura, as ICU carries it; admins shift a day for local sighting.
        $this->assertSame('2027-03-09', $day('eidfitr', 2027));
        $this->assertSame('2027-05-16', $day('eidadha', 2027));
        $this->assertSame('2026-12-31', $occasions->runs('newyear', 2027)[1]['from']);
    }
}
