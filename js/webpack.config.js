const config = require('flarum-webpack-config');

/*
 * forum.js and admin.js as usual, plus stage.js: the centrepieces, effects and
 * tunes, a standalone script the server adds to the page only on a day with a
 * moment. Loading it that way, rather than as a lazy chunk, keeps webpack's
 * chunk loader (about 3 KB) out of forum.js, which every visitor downloads.
 */
module.exports = (...args) => {
  let base = config();
  if (typeof base === 'function') base = base(...args);

  base.entry = { ...base.entry, stage: './stage.ts' };

  // `import m from 'mithril'` is core's own Mithril, the global `m`: never a second copy in the bundle.
  base.externals = [{ mithril: 'm' }, ...base.externals];

  return base;
};
