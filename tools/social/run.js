// The social batch: render random WODBLOK designs, make a contact sheet, email it.
//   npm run social -- --dry                 render only, nothing is sent, the schedule is ignored
//   npm run social -- --dry --count 2       a small test batch
//   npm run social -- --force               render and send now, ignoring the schedule
//   npm run social                          render and send only when the schedule in config.js says it is time
//   npm run social -- --dry --seeds 20261019101,20261019102 [--size 2048]    re-render exact picks from a manifest
// Settings live in tools/social/config.js. The email key and addresses come from RESEND_API_KEY, WB_SOCIAL_TO and WB_SOCIAL_FROM.
const path = require('path');
const { validate } = require('./validate');
const { isDue } = require('./due');

function parseArgs(argv) {
  const a = { dry: false, force: false, count: null, seeds: null, size: null, out: null };
  const need = (i, name) => { if (argv[i + 1] === undefined) throw new Error(`${name} needs a value`); return argv[i + 1]; };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--dry') a.dry = true;
    else if (k === '--force') a.force = true;
    else if (k === '--count') a.count = +need(i++, k);
    else if (k === '--size') a.size = +need(i++, k);
    else if (k === '--out') a.out = need(i++, k);
    else if (k === '--seeds') a.seeds = need(i++, k).split(',').map(Number);
    else throw new Error(`unknown option ${k}`);
  }
  if (a.count !== null && !(Number.isInteger(a.count) && a.count >= 1 && a.count <= 50)) throw new Error('--count must be a whole number from 1 to 50');
  if (a.size !== null && !(Number.isInteger(a.size) && a.size >= 256 && a.size <= 4096)) throw new Error('--size must be a whole number from 256 to 4096');
  if (a.seeds && a.seeds.some(s => !Number.isInteger(s) || s < 0)) throw new Error('--seeds must be whole numbers separated by commas');
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = validate(require('./config'), { needEmail: !args.dry });
  if (!args.dry && !args.force && !isDue(cfg.schedule, new Date())) { console.log('Not due yet (see schedule in tools/social/config.js). Use --force to send now.'); return; }
  const { renderBatch, utcDate } = require('./render');
  const batch = await renderBatch(cfg, {
    count: args.count, seeds: args.seeds, size: args.size,
    outDir: args.out ? path.resolve(args.out) : null, log: s => console.log(s),
  });
  const n = batch.items.length;
  console.log(`Made ${n} of ${batch.manifest.wanted} in ${batch.manifest.seconds} s: ${batch.outDir}`);
  if (!n) { console.error('No usable designs, so nothing was sent.'); process.exit(1); }
  if (args.dry) { console.log('Dry run: nothing sent.'); return; }
  const { buildEmail, sendEmail } = require('./email');
  const id = await sendEmail(buildEmail(cfg, batch, utcDate()), process.env.RESEND_API_KEY);
  console.log('Email sent' + (id ? ' (id ' + id + ')' : '') + '.');
}

if (require.main === module) main().catch(e => { console.error(e.message || e); process.exit(1); });
module.exports = { parseArgs };
