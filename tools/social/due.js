// Is a batch due right now? Used by the hourly workflow before anything is installed, so this file has no dependencies.
// `node tools/social/due.js` prints due=true or due=false (and writes it to $GITHUB_OUTPUT when that exists).
const { validateSchedule, DAYS } = require('./validate');

function localParts(now, tz) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23' });
  const p = {};
  for (const x of f.formatToParts(now)) p[x.type] = x.value;
  return { day: p.weekday.slice(0, 3).toLowerCase(), hour: (+p.hour) % 24, y: +p.year, m: +p.month, d: +p.day };
}

// ISO week number of a calendar date
function isoWeek(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3);               // the Thursday of this week
  const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}

function isDue(schedule, now = new Date()) {
  validateSchedule(schedule);
  const l = localParts(now, schedule.tz);
  if (l.hour !== schedule.hour) return false;
  if (schedule.every === 'day') return true;
  if (!schedule.days.includes(l.day)) return false;
  if (schedule.every === 'fortnight') return isoWeek(l.y, l.m, l.d) % 2 === schedule.weekParity;
  return true;
}

if (require.main === module) {
  const cfg = require('./config');
  const i = process.argv.indexOf('--now');
  const now = i > 0 ? new Date(process.argv[i + 1]) : new Date();
  if (isNaN(now)) { console.error('--now needs a date like 2026-10-19T12:00:00Z'); process.exit(2); }
  const due = isDue(cfg.schedule, now);
  console.log('due=' + due);
  if (process.env.GITHUB_OUTPUT) require('fs').appendFileSync(process.env.GITHUB_OUTPUT, 'due=' + due + '\n');
}

module.exports = { isDue, isoWeek, localParts, DAYS };
