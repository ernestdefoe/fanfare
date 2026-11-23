<?php

namespace ErnestDefoe\Fanfare\Extend;

use ErnestDefoe\Fanfare\Config;
use Flarum\Extend\ExtenderInterface;
use Flarum\Extension\Extension;
use Illuminate\Contracts\Container\Container;

/**
 * Marks an extension Fanfare works with as enabled. extend.php registers one
 * inside each Extend\Conditional block, so Config never asks the extension
 * manager and nothing from an absent extension is ever loaded.
 */
class With implements ExtenderInterface
{
    public function __construct(protected string $name)
    {
    }

    public function extend(Container $container, ?Extension $extension = null): void
    {
        $container->instance(Config::WITH.$this->name, true);
    }
}
