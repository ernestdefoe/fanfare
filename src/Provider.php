<?php

namespace ErnestDefoe\Fanfare;

use Flarum\Foundation\AbstractServiceProvider;

class Provider extends AbstractServiceProvider
{
    public function register(): void
    {
        // One of each per request: settings are read once, dates and the day's people remembered.
        $this->container->singleton(Config::class);
        $this->container->singleton(Occasions::class);
        $this->container->singleton(People::class);
    }
}
