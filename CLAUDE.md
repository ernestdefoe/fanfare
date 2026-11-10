# Fanfare: working rules

- **Commit straight to `main` and push. Never open a pull request on this repo.** Commit subjects are conventional (`feat:`, `fix:`); the release drafter bumps from the subject.
- `js/dist` is committed and is what forums load. After any change under `js/src`, run `npm run build` in `js/` (from a fresh `npm ci`) and commit the bundle; CI fails if it is stale.
- Publishing a release is Ernest's click. Nothing is announced until he says so. Every change goes to the Command Center for review first.

## Design rules that exist for a reason

- **Normal days carry nothing.** `Content\Inject` adds the `fanfare` payload only when there is an occasion, someone's day or the actor's own day, and adds `<script defer src=stage-<hash>.js>` only when the actor has a moment to see. The stage is a separate webpack ENTRY (`js/stage.js`), not a lazy chunk: a chunk would pull webpack's loader into forum.js for everyone (Festoon's lesson).
- **The browser decides "today".** The server sends yesterday-to-tomorrow in the forum's timezone; `js/src/forum/today.js` picks the member's own day, so New Year comes at each member's midnight.
- **Costs are per day, not per request**: occasions are cached for the day (`Occasions::around`), people for 15 minutes (`People::around`, forgotten when a member changes their birthday). Two user queries and one hydrate, whatever the traffic. Join anniversaries use a month-day expression on `joined_at` per database (`People::monthDay`), which wraps the column with the grammar so the table prefix is kept.
- **Birthdays come from one place**: Fanfare's own columns, or `datlechin/flarum-birthdays` (its `birthday`/`show_birthday`/`show_age` and its `user.viewBirthday` permission) when that is enabled. A hidden birthday is never listed or wishable, but its owner is still greeted.
- **Dates**: `src/Calendar` is a copy of Festoon's calendar code. When Festoon is enabled its looks' rules (overrides included) and its `Dates` are used so the two agree. A date fix belongs in both.
- **Wishes**: one per pair, kind and year (a unique key; a duplicate answers 200, not an error). The notification's subject is the wisher (a User), so no new API resource is needed — a notification subject without a resource 500s every notification.
- **Stage**: plain DOM + SVG, no Mithril. Everything forum-specific comes from the `host` object forum.js passes (translations, names, preferences). Its CSS is a string injected on first open, every selector under `.FanfareStage`, keyframes prefixed `ff-`, SVG ids prefixed `ff-` (other inline SVGs on the page can't capture `url(#…)`). The canvas sits at z-index 1003, the stage at 1001: above the header, under Flarum's modals and alerts.
- 🚨 Never name a variable `m` in a file with JSX (it shadows Mithril; `m is not a function`). Never export a name with a digit from a module (flarum-webpack-config's export registry mangled `f1` to `f` and broke the stage).
- Fonts (Pacifico, Creepster, OFL) ship in `assets/fonts` and are served from the forum's assets: no request to a font service.

## Testing

- `composer test:setup && composer test` (locally `DB_DRIVER=sqlite DB_PREFIX=ff_` proves prefix safety), `composer analyse:phpstan`.
- `cd js && npm ci && npm run build`.
- Browser: `~/github/scopes/fanfare-shots/shots.mjs` against the local forum `~/Herd/fanfaredev` (admin previews every moment in light, dark and 390px).
