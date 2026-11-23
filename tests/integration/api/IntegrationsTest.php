<?php

namespace ErnestDefoe\Fanfare\Tests\integration\api;

use DateTimeImmutable;
use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Occasions;
use Ernestdefoe\Syllabus\Course;
use Ernestdefoe\Syllabus\Event\CourseCompleted;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use Flarum\User\User;
use Illuminate\Contracts\Events\Dispatcher;
use PHPUnit\Framework\Attributes\Test;

/**
 * Fanfare beside Syllabus (course completions celebrated) and Festoon (the
 * admin's own Festoon days celebrated as occasions).
 */
class IntegrationsTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    protected const CODE = '0123456789abcdef0123456789abcdef';

    protected function setUp(): void
    {
        parent::setUp();

        $syllabus = str_contains($this->name(), 'course');
        $this->extension(...[...($syllabus ? ['ernestdefoe-syllabus'] : ['ernestdefoe-festoon']), 'ernestdefoe-fanfare']);

        $data = [
            User::class => [
                $this->normalUser(),
                ['id' => 3, 'username' => 'mira', 'email' => 'mira@machine.local', 'is_email_confirmed' => 1, 'joined_at' => '2020-01-01'],
                ['id' => 4, 'username' => 'quiet', 'email' => 'quiet@machine.local', 'is_email_confirmed' => 1, 'joined_at' => '2020-01-01', 'preferences' => json_encode(['syllabusShowCourses' => false])],
            ],
            'group_user' => [['user_id' => 3, 'group_id' => 3], ['user_id' => 4, 'group_id' => 3]],
        ];

        if ($syllabus) {
            $data['syllabus_courses'] = [
                ['id' => 1, 'user_id' => 1, 'title' => 'Intro to Pottery', 'slug' => 'intro-to-pottery', 'status' => 'published', 'published_at' => '2026-01-01 00:00:00'],
                ['id' => 2, 'user_id' => 1, 'title' => 'Secret Draft', 'slug' => 'secret-draft', 'status' => 'draft'],
            ];
            $data['syllabus_certificates'] = [
                ['id' => 1, 'course_id' => 1, 'user_id' => 3, 'code' => self::CODE, 'course_title' => 'Intro to Pottery', 'user_name' => 'mira', 'issued_at' => '2026-01-01 00:00:00'],
            ];
        }

        $this->prepareDatabase($data);
        $this->setting(Config::OCCASIONS, json_encode(array_map(fn () => ['on' => false], Occasions::CATALOGUE)));
    }

    /** The fanfare payload of the forum page, or null. */
    protected function payload(?int $as): ?array
    {
        return $this->payloadAt('/', $as);
    }

    /** The JSON object starting at $start, by matching braces outside strings. */
    protected function object(string $html, int $start): ?array
    {
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

    /** Change a setting once the app is running ($this->setting() applies only before it boots). */
    protected function set(string $key, mixed $value): void
    {
        $this->app()->getContainer()->make(SettingsRepositoryInterface::class)->set($key, $value);
    }

    protected function complete(int $user, int $course): void
    {
        $this->app()->getContainer()->make(Dispatcher::class)->dispatch(new CourseCompleted(User::findOrFail($user), Course::findOrFail($course)));
    }

    #[Test]
    public function a_completed_course_gives_the_student_a_moment_and_others_a_line()
    {
        $this->complete(3, 1);
        $this->complete(3, 1);

        $this->assertSame(1, $this->database()->table('fanfare_achievements')->count(), 'once per member and course');

        $mine = $this->payload(3);
        $this->assertSame('Intro to Pottery', $mine['myCourses'][0]['title']);
        $this->assertStringContainsString(self::CODE, $mine['myCourses'][0]['url']);
        $this->assertArrayNotHasKey('courses', $mine, 'the student is not listed to themselves');

        $theirs = $this->payload(2);
        $this->assertSame([3], array_column($theirs['courses']['list'], 'user'));
        $this->assertSame('mira', $theirs['courses']['users'][3]['username']);
        $this->assertArrayNotHasKey('myCourses', $theirs);
        $this->assertTrue($theirs['canWish']);
    }

    #[Test]
    public function course_completions_respect_privacy_drafts_and_the_public_switch()
    {
        $this->complete(4, 1);
        $this->complete(3, 2);

        $this->assertNull($this->payload(2)['courses'] ?? null, 'a private member and a draft course are not listed');
        $this->assertSame('Intro to Pottery', $this->payload(4)['myCourses'][0]['title'], 'a private member still gets their own moment');

        $this->complete(3, 1);
        $this->assertNotNull($this->payload(2)['courses'] ?? null);

        // Turning courses private in Syllabus takes effect at once, not when the cached list runs out.
        $private = fn (bool $show) => $this->send($this->request('PATCH', '/api/users/3', [
            'authenticatedAs' => 3,
            'json' => ['data' => ['type' => 'users', 'id' => '3', 'attributes' => ['preferences' => ['syllabusShowCourses' => $show]]]],
        ]));
        $this->assertSame(200, $private(false)->getStatusCode());
        $this->assertNull($this->payload(2)['courses'] ?? null, 'private at once');
        $private(true);
        $this->assertNotNull($this->payload(2)['courses'] ?? null);
        $this->assertNull($this->payload(null)['courses'] ?? null, 'guests need See today\'s birthdays');

        $this->set(Config::COURSES_PUBLIC, false);
        $this->assertNull($this->payload(2)['courses'] ?? null);

        $this->set(Config::COURSES, false);
        $this->assertNull($this->payload(3), 'turned off, nothing at all');
    }

    #[Test]
    public function congratulating_a_course_once_notifies_and_twice_does_not()
    {
        $this->complete(3, 1);
        $id = (int) $this->database()->table('fanfare_achievements')->value('id');
        $wish = fn (int $to, int $ref) => $this->send($this->request('POST', '/api/fanfare/wishes', ['authenticatedAs' => 2, 'json' => ['userId' => $to, 'kind' => 'course', 'achievementId' => $ref]]));

        $this->assertSame(201, $wish(3, $id)->getStatusCode());
        $this->assertSame(200, $wish(3, $id)->getStatusCode());
        $this->assertSame(422, $wish(3, $id + 1)->getStatusCode(), 'a completion that is not there');
        $this->assertSame(422, $wish(4, $id)->getStatusCode(), 'someone else\'s completion');

        $alert = $this->database()->table('notifications')->where('type', 'fanfareWish')->where('user_id', 3)->first();
        // assertEquals: MySQL's JSON type stores the keys in its own order.
        $this->assertEquals(['to' => 3, 'kind' => 'course', 'year' => (int) date('Y'), 'ref' => $id, 'title' => 'Intro to Pottery'], json_decode($alert->data, true));
        $this->assertContains('course:'.$id, $this->payload(2)['wished']);

        $own = $this->send($this->request('POST', '/api/fanfare/wishes', ['authenticatedAs' => 3, 'json' => ['userId' => 3, 'kind' => 'course', 'achievementId' => $id]]));
        $this->assertSame(422, $own->getStatusCode());
    }

    #[Test]
    public function an_admin_previews_a_course_completion()
    {
        $this->assertSame([['id' => 0, 'title' => '', 'url' => null]], array_map(fn ($c) => array_diff_key($c, ['at' => 1]), $this->payloadAt('/', 1, ['fanfare' => 'course'])['myCourses']));
    }

    #[Test]
    public function a_festoon_day_is_an_occasion_with_its_own_name_emoji_and_colors()
    {
        $md = (new DateTimeImmutable('today'))->format('m-d');
        $this->setting('ernestdefoe-festoon.custom', json_encode([
            ['id' => 'carnival', 'name' => 'Carnival', 'from' => $md, 'to' => $md, 'primary' => '#aa0055', 'secondary' => '#ffcc00', 'emoji' => '🎭'],
            ['id' => 'switched-off', 'name' => 'Off in Festoon', 'from' => $md, 'to' => $md, 'enabled' => false],
        ]));

        $occasions = $this->payload(2)['occasions'];
        $this->assertSame(['custom-carnival'], array_column($occasions, 'id'));
        $this->assertSame(['name' => 'Carnival', 'emoji' => '🎭', 'primary' => '#aa0055', 'secondary' => '#ffcc00'], $occasions[0]['custom']);
        $this->assertSame('Carnival', $this->payloadAt('/', 1, ['fanfare' => 'custom-carnival'])['occasions'][0]['custom']['name']);

        $this->set(Config::OCCASIONS, json_encode(['custom-carnival' => ['on' => false]] + array_map(fn () => ['on' => false], Occasions::CATALOGUE)));
        $this->assertNull($this->payload(2), 'turned off in Fanfare');
    }

    #[Test]
    public function a_festoon_day_across_new_year_runs_into_the_next_year()
    {
        $this->setting('ernestdefoe-festoon.custom', json_encode([['id' => 'winter', 'name' => 'Winter Break', 'from' => '12-30', 'to' => '01-02']]));

        $runs = $this->app()->getContainer()->make(Occasions::class)->runs('custom-winter', 2026);
        $this->assertContains(['from' => '2026-12-30', 'to' => '2027-01-02', 'day' => '2026-12-30'], $runs);
    }

    /** $query: the page's query string, e.g. an admin preview. */
    protected function payloadAt(string $path, ?int $as, array $query = []): ?array
    {
        $html = $this->send($this->request('GET', $path, $as ? ['authenticatedAs' => $as] : [])->withQueryParams($query))->getBody()->getContents();
        $at = strpos($html, '"fanfare":{');

        return $at === false ? null : $this->object($html, $at + strlen('"fanfare":'));
    }
}
