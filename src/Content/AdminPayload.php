<?php

namespace ErnestDefoe\Fanfare\Content;

use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Occasions;
use Flarum\Frontend\Document;

/** The admin page's live numbers: when each occasion falls next (Festoon's own days too), and what is installed beside Fanfare. */
class AdminPayload
{
    public function __construct(protected Config $config, protected Occasions $occasions)
    {
    }

    public function __invoke(Document $document): void
    {
        $document->payload['fanfareAdmin'] = [
            'next' => $this->occasions->next(),
            'catalogue' => array_map(fn (array $o) => ['on' => $o['on'], 'shift' => (bool) ($o['shift'] ?? false), 'festoon' => isset($o['festoon'])], Occasions::CATALOGUE),
            'festoon' => $this->config->festoon(),
            'custom' => array_map(fn (array $d) => ['name' => $d['name'], 'emoji' => $d['emoji']], $this->config->festoonDays()),
            'syllabus' => $this->config->syllabus(),
            'datlechin' => $this->config->datlechin(),
            'timezone' => $this->config->timezone()->getName(),
        ];
    }
}
