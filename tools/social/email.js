// Builds and sends the batch email through Resend's HTTP API (no library). Nothing here prints the key or the addresses.
const fs = require('fs');
const path = require('path');

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// batch: { outDir, items: [{n, file, seed, palette}], manifest }. Returns the JSON body for POST /emails.
function buildEmail(cfg, batch, date) {
  const e = cfg.email, m = batch.manifest;
  const sheetPath = path.join(batch.outDir, 'contact-sheet.jpg');
  const attachments = [{ filename: 'contact-sheet.jpg', content: fs.readFileSync(sheetPath).toString('base64'), content_type: 'image/jpeg', content_id: 'contact-sheet' }];
  const budget = e.maxAttachmentMB * 1024 * 1024;
  let used = attachments[0].content.length, full = 0;
  for (const it of batch.items) {
    const b = fs.readFileSync(path.join(batch.outDir, it.file)).toString('base64');
    if (used + b.length > budget) continue;
    attachments.push({ filename: it.file, content: b, content_type: 'image/png' });
    used += b.length; full++;
  }
  const lines = batch.items.map(it => `${it.n}. seed ${it.seed}, palette ${it.palette.join(' ')}`);
  const note = full === batch.items.length ? `All ${full} full-size PNGs are attached.`
    : `Only ${full} of ${batch.items.length} full-size PNGs fit in the email. Re-render any pick at full size from its seed (see manifest.json in the run, or the command below).`;
  const text = [
    `${batch.items.length} designs (${m.size} x ${m.size} px), made ${date}.`, note, '', ...lines, '',
    `Re-render a pick: ${m.rerender}`,
  ].join('\n');
  const html = `<div style="font:15px/1.5 system-ui,sans-serif;color:#222;max-width:680px">
<p><b>${batch.items.length} designs</b> (${m.size} &times; ${m.size} px), made ${esc(date)}. ${esc(note)}</p>
<p><img src="cid:contact-sheet" alt="Contact sheet" style="max-width:100%;height:auto;border-radius:6px"></p>
<p style="font:13px/1.6 ui-monospace,monospace;color:#555">${lines.map(esc).join('<br>')}</p>
<p style="font-size:13px;color:#555">Re-render a pick: <code>${esc(m.rerender)}</code></p></div>`;
  return { from: e.from, to: [e.to], subject: `${e.subjectPrefix}: ${date} (${batch.items.length} images)`, html, text, attachments };
}

// fetchFn is injectable so tests never touch the network
async function sendEmail(payload, apiKey, fetchFn = fetch) {
  const res = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`email not sent: HTTP ${res.status} ${body.slice(0, 300).replace(apiKey, '***')}`);
  try { return JSON.parse(body).id || ''; } catch (e) { return ''; }
}

module.exports = { buildEmail, sendEmail };
