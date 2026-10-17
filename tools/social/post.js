// Posts the pictures you approved. Run from GitHub (Actions > social-post > Run workflow) or a terminal:
//   npm run social:post -- --seeds 1562344001,1562344004 --caption "Hello" --accounts all            test run: renders, checks, posts nothing
//   npm run social:post -- --seeds 1562344001 --caption "Hello" --accounts wodblok-ig --real         really posts
// Steps: check everything -> re-make exactly your picks from their seeds (full-size JPEG) -> upload to the media host ->
// post to each chosen account -> delete the uploads. Without --real nothing is uploaded or posted.
const path = require('path');
const fs = require('fs');
const { validate } = require('./validate');
const { validateAccounts, pickAccounts, missingSecrets, publishAll } = require('./publish');

function parseArgs(argv) {
  const a = { seeds: null, caption: '', accounts: 'all', real: false, size: null, out: null };
  const need = (i, name) => { if (argv[i + 1] === undefined) throw new Error(`${name} needs a value`); return argv[i + 1]; };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--real') a.real = true;
    else if (k === '--seeds') a.seeds = need(i++, k).split(/[\s,]+/).filter(Boolean).map(Number);
    else if (k === '--caption') a.caption = need(i++, k).replace(/\\n/g, '\n');     // the form is one line: type \n for a new line
    else if (k === '--accounts') a.accounts = need(i++, k);
    else if (k === '--size') a.size = +need(i++, k);
    else if (k === '--out') a.out = need(i++, k);
    else throw new Error(`unknown option ${k}`);
  }
  if (!a.seeds || !a.seeds.length) throw new Error('--seeds is required: the seeds of the pictures you approved (they are listed in the batch email)');
  if (a.seeds.some(s => !Number.isInteger(s) || s < 0)) throw new Error('--seeds must be whole numbers separated by commas');
  if (new Set(a.seeds).size !== a.seeds.length) throw new Error('--seeds has the same seed twice');
  if (a.seeds.length > 10) throw new Error('--seeds: at most 10 pictures per post (an Instagram carousel holds 10)');
  if (a.size !== null && !(Number.isInteger(a.size) && a.size >= 256 && a.size <= 4096)) throw new Error('--size must be a whole number from 256 to 4096');
  return a;
}

// deps are injectable so tests need no browser and no network
async function runPost(args, deps) {
  const { cfg, env, log = () => {} } = deps;
  const accounts = pickAccounts(validateAccounts(deps.accounts), args.accounts);
  log(`Accounts: ${accounts.map(a => a.id).join(', ')}. ${args.real ? 'REAL POST' : 'Test run (nothing is uploaded or posted)'}.`);

  // fail fast, before the slow part
  const probe = { caption: args.caption, images: args.seeds.map(() => ({ url: '' })) };
  const bad = (await publishAll(probe, accounts, { env, real: false })).filter(r => !r.ok);
  if (bad.length) throw new Error(bad.map(b => `${b.account}: ${b.error}`).join('\n'));
  let host = null;
  if (args.real) {
    const gone = missingSecrets(accounts, env);
    if (gone.length) throw new Error('missing secrets: ' + gone.join(', '));
    host = deps.makeHost(env);       // throws and names the missing media-host secrets
  }

  const batch = await deps.renderBatch(cfg, { seeds: args.seeds, size: args.size, outDir: args.out ? path.resolve(args.out) : null, jpeg: true, log });
  if (batch.items.length !== args.seeds.length) throw new Error(`only ${batch.items.length} of ${args.seeds.length} pictures could be re-made, so nothing was posted`);
  const files = batch.items.map(it => path.join(batch.outDir, it.file.replace('.png', '.jpg')));

  if (!args.real) {
    log(`Test run done: ${files.length} picture(s) re-made at ${batch.manifest.size} px. Real run would post them to ${accounts.map(a => a.id).join(', ')}.`);
    return { real: false, batch, results: accounts.map(a => ({ account: a.id, ok: true, test: true })) };
  }

  const prefix = `posts/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const keys = [];
  try {
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const key = `${prefix}/${String(i + 1).padStart(2, '0')}.jpg`;
      images.push({ url: await host.upload(fs.readFileSync(files[i]), key, 'image/jpeg'), seed: args.seeds[i] });
      keys.push(key);
    }
    log(`Uploaded ${images.length} picture(s).`);
    const results = await publishAll({ caption: args.caption, images }, accounts, { env, real: true, fetchFn: deps.fetchFn, wait: deps.wait, log });
    for (const r of results) log(r.ok ? `  ${r.account}: posted ${r.link || r.id}` : `  ${r.account}: FAILED ${r.error}`);
    return { real: true, batch, results };
  } finally {
    for (const k of keys) { try { await host.remove(k); } catch (e) { log(`  (could not delete ${k}: ${e.message}; delete it in the bucket)`); } }
    if (keys.length) log(`Deleted ${keys.length} upload(s) from the media host.`);
  }
}

// A short plain-text report for the email and the run summary
function report(args, out) {
  const lines = out.results.map(r => r.test ? `${r.account}: checked (test run)` : r.ok ? `${r.account}: posted ${r.link || r.id}` : `${r.account}: FAILED: ${r.error}`);
  return [`${out.real ? 'Posted' : 'Test run of'} ${args.seeds.length} picture(s) (seeds ${args.seeds.join(', ')}).`, '', ...lines, '', 'Caption:', args.caption || '(none)'].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = validate(require('./config'));
  const env = { ...process.env, ...JSON.parse(process.env.WB_ALL_SECRETS || '{}') };    // the workflow hands over the repo secrets as one JSON value, so new accounts need no workflow edit
  const { renderBatch } = require('./render');
  const { makeHost } = require('./publish/host');
  const out = await runPost(args, { cfg, accounts: require('./accounts'), env, renderBatch, makeHost, log: s => console.log(s) });
  const text = report(args, out);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + text + '\n```\n');
  if (out.real && env.RESEND_API_KEY && env.WB_SOCIAL_TO && env.WB_SOCIAL_FROM) {
    try { await require('./email').sendEmail({ from: env.WB_SOCIAL_FROM, to: [env.WB_SOCIAL_TO], subject: `${cfg.email.subjectPrefix}: post report`, text }, env.RESEND_API_KEY); }
    catch (e) { console.log('(report email not sent: ' + e.message + ')'); }
  }
  if (out.results.some(r => !r.ok)) process.exit(1);
}

if (require.main === module) main().catch(e => { console.error(e.message || e); process.exit(1); });
module.exports = { parseArgs, runPost, report };
