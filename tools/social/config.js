// Settings for the weekly social batch (tools/social). Change values here; every run checks them first (validate.js) and stops with a clear message if one is wrong.
// Plain data only. Secrets and addresses are NOT written here: the repo is public, so they come from environment variables (GitHub Actions secrets).
module.exports = {
  count: 12,                         // images per batch
  size: 1080,                        // square, in pixels (256 to 4096)
  types: ['canvas'],                 // only 'canvas' for now (repeat and book come later)

  schedule: {
    every: 'week',                   // 'day' | 'week' | 'fortnight'
    days: ['mon'],                   // used for 'week' and 'fortnight': sun mon tue wed thu fri sat
    hour: 8,                         // local hour, 0 to 23 (the workflow wakes every hour and checks this)
    tz: 'America/New_York',
    weekParity: 0,                   // 'fortnight' only: runs on ISO weeks that are even (0) or odd (1)
  },

  email: {
    to: process.env.WB_SOCIAL_TO,    // secret: GitHub > Settings > Secrets and variables > Actions
    from: process.env.WB_SOCIAL_FROM,
    subjectPrefix: 'WODBLOK batch',
    maxAttachmentMB: 25,             // full-size PNGs are attached only while the total stays under this; the contact sheet is always sent
  },

  // How each design is made. Each image is one Randomize roll on a square canvas.
  roll: {
    // Randomize switches (the Randomize panel, 2.76.3): above 0 is on. Keys: bg (Background) pat (Pattern) focal (Focal point) text frame efx (Effects) fin (Finish).
    // Left out or 0 means off. Colours are set by the `colours` line below, not here.
    features: { bg: 100, pat: 100 },
    look: 'repeat',                  // the Look: any, repeat, poster, plate, badge, specimen, modern, sun, quilt
    // Plain colour sets (hex), paper first, then ink, then accents. Every design uses exactly one set. Add your own; 2 to 4 colours each.
    colours: 'app',                  // 'app' = the app's own Randomize colours (includes the Wada sets); 'plain' = one of the plain palettes below
    palettes: [   // used only when colours is 'plain'
      ['#f4ecd8', '#23395b', '#d1603d', '#e8b04a'],
      ['#e9efe6', '#2f4f3e', '#c2553f', '#d9b86c'],
      ['#1f2a44', '#f2e8cf', '#e07a5f', '#81b29a'],
      ['#f6f1e7', '#14213d', '#fca311'],
      ['#efe3d0', '#5a2a27', '#c98b4d', '#7a8b69'],
      ['#fbf7f0', '#222222', '#d64045'],
      ['#dfe7ea', '#1b4965', '#e29578'],
      ['#2b2d42', '#edf2f4', '#ef233c'],
    ],
    // Keep a roll only if it passes; otherwise the next seed is tried (up to maxAttempts per image).
    layouts: ['auto', 'grid', 'brick', 'halfdrop', 'hex'],   // allowed grid layouts of the layers
    layers: [1, 3],                  // allowed number of layers [min, max]
    maxAttempts: 6,
  },

  seedBase: 'random',                // 'random' (new every run; the seeds are saved in manifest.json so any pick can be re-made), 'date' (today as YYYYMMDD), or a fixed whole number
};
