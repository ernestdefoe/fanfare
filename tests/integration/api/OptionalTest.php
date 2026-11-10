<?php

namespace ErnestDefoe\Fanfare\Tests\integration\api;

use DateTimeImmutable;
use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Occasions;
use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use Flarum\User\User;
use PHPUnit\Framework\Attributes\Test;

/**
 * Fanfare beside the extensions it works with: datlechin/flarum-birthdays
 * (its field and privacy are used instead of Fanfare's) and flarum/gdpr
 * (erasure nulls Fanfare's columns and nothing breaks).
 */
class OptionalTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    protected string $md;

    protected function setUp(): void
    {
        parent::setUp();

        $with = match (true) {
            str_contains($this->name(), 'datlechin') => ['datlechin-birthdays'],
            str_contains($this->name(), 'suspend') => ['flarum-suspend'],
            default => ['flarum-gdpr'],
        };
        $this->extension(...[...$with, 'ernestdefoe-fanfare']);
        $this->md = (new DateTimeImmutable('today'))->format('m-d');
        $born = ((int) date('Y') - 30).'-'.$this->md;

        $users = [
            $this->normalUser(),
            ['id' => 3, 'username' => 'mira', 'email' => 'mira@machine.local', 'is_email_confirmed' => 1, 'joined_at' => '2020-01-01', 'fanfare_birthday' => $this->md, 'fanfare_birthday_visibility' => 2],
        ];

        if ($with === ['datlechin-birthdays']) {
            $users[1] += ['birthday' => $born, 'show_birthday' => 1, 'show_age' => 1];
            $users[] = ['id' => 4, 'username' => 'quiet', 'email' => 'quiet@machine.local', 'is_email_confirmed' => 1, 'joined_at' => '2020-01-01', 'birthday' => $born, 'show_birthday' => 0, 'show_age' => 0];
        }

        $this->prepareDatabase([
            User::class => $users,
            'group_user' => array_map(fn ($u) => ['user_id' => $u['id'], 'group_id' => 3], array_slice($users, 1)),
            'group_permission' => [['group_id' => 3, 'permission' => 'user.viewBirthday']],
        ]);
        $this->setting(Config::OCCASIONS, json_encode(array_map(fn () => ['on' => false], Occasions::CATALOGUE)));
    }

    protected function people(int $as): ?array
    {
        $html = $this->send($this->request('GET', '/', ['authenticatedAs' => $as]))->getBody()->getContents();
        preg_match('/"birthdays":(\[[^\]]*\])/', $html, $m);

        return isset($m[1]) ? json_decode($m[1], true) : null;
    }

    #[Test]
    public function with_datlechin_birthdays_come_from_its_field_and_privacy()
    {
        $birthdays = $this->people(2);

        $this->assertSame([3], array_column($birthdays, 'id'));
        $this->assertSame(30, $birthdays[0]['age']);

        // Fanfare's own fields stand down.
        $me = json_decode($this->send($this->request('GET', '/api/users/2', ['authenticatedAs' => 2]))->getBody()->getContents(), true);
        $this->assertArrayNotHasKey('fanfareBirthday', $me['data']['attributes']);

        $wish = $this->send($this->request('POST', '/api/fanfare/wishes', ['authenticatedAs' => 2, 'json' => ['userId' => 4, 'kind' => 'birthday']]));
        $this->assertSame(422, $wish->getStatusCode(), 'a birthday hidden in datlechin is not wishable');
        $this->assertSame(201, $this->send($this->request('POST', '/api/fanfare/wishes', ['authenticatedAs' => 2, 'json' => ['userId' => 3, 'kind' => 'birthday']]))->getStatusCode());
    }

    #[Test]
    public function with_suspend_a_suspended_member_is_not_listed_or_wishable()
    {
        $this->database()->table('users')->where('id', 3)->update(['suspended_until' => (new DateTimeImmutable('+3 days'))->format('Y-m-d H:i:s')]);

        $this->assertNull($this->people(2));
        $this->assertSame(422, $this->send($this->request('POST', '/api/fanfare/wishes', ['authenticatedAs' => 2, 'json' => ['userId' => 3, 'kind' => 'birthday']]))->getStatusCode());

        // Once the suspension is over, they're back.
        $this->database()->table('users')->where('id', 3)->update(['suspended_until' => (new DateTimeImmutable('-1 day'))->format('Y-m-d H:i:s')]);
        $this->app()->getContainer()->make(\ErnestDefoe\Fanfare\People::class)->forget();
        $this->assertSame([3], array_column($this->people(2), 'id'));
    }

    #[Test]
    public function with_gdpr_an_erased_member_drops_out_cleanly()
    {
        $this->assertSame([3], array_column($this->people(2), 'id'));

        // What flarum/gdpr's anonymization does to columns it doesn't know: null them.
        $this->database()->table('users')->where('id', 3)->update(['fanfare_birthday' => null, 'fanfare_birth_year' => null, 'fanfare_birthday_visibility' => null]);
        $this->app()->getContainer()->make(\ErnestDefoe\Fanfare\People::class)->forget();

        $this->assertNull($this->people(2));
        $this->assertSame(200, $this->send($this->request('GET', '/', ['authenticatedAs' => 3]))->getStatusCode());
    }
}
