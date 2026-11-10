<?php

namespace ErnestDefoe\Fanfare\Content;

use ErnestDefoe\Fanfare\Config;
use ErnestDefoe\Fanfare\Occasions;
use Flarum\Frontend\Document;

/** The admin page's live numbers: when each occasion falls next, and what is installed beside Fanfare. */
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
            'datlechin' => $this->config->datlechin(),
            'timezone' => $this->config->timezone()->getName(),
        ];
    }
}
