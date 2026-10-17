// Instagram adapter (Instagram API with Instagram Login: a professional account, no Facebook Page needed).
// Flow from Meta's Content Publishing docs: make a media container from a public image address, wait until it is FINISHED, then publish it.
// Several pictures go up as one carousel (2 to 10). Token and account id come from the env names set in accounts.js.
const API = 'https://graph.instagram.com/v23.0';    // the one place the Graph version lives
const MAX_CAPTION = 2200, MAX_TAGS = 30, MAX_IMAGES = 10;

// problems with the post itself, before anything is uploaded. Empty list = fine.
function check(post) {
  const bad = [];
  if (!post.images.length) bad.push('no pictures');
  if (post.images.length > MAX_IMAGES) bad.push(`${post.images.length} pictures; a carousel holds at most ${MAX_IMAGES}`);
  if ((post.caption || '').length > MAX_CAPTION) bad.push(`caption is ${post.caption.length} characters; the limit is ${MAX_CAPTION}`);
  if (((post.caption || '').match(/#\w+/g) || []).length > MAX_TAGS) bad.push(`more than ${MAX_TAGS} hashtags`);
  return bad;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ctx: { token, userId, fetchFn, wait (ms between status checks), log }
async function publish(post, ctx) {
  const { token, userId, fetchFn = fetch, wait = 5000, log = () => {} } = ctx;
  const call = async (method, path, params) => {
    const url = new URL(API + path);
    const init = { method, headers: { Authorization: 'Bearer ' + token } };
    if (method === 'GET') for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
    else { init.headers['Content-Type'] = 'application/x-www-form-urlencoded'; init.body = new URLSearchParams(params).toString(); }
    const res = await fetchFn(url.toString(), init);
    const text = await res.text();
    let json = {}; try { json = JSON.parse(text); } catch (e) { /* keep {} */ }
    if (!res.ok || json.error) {
      const msg = json.error ? `${json.error.message || 'error'} (code ${json.error.code})` : text.slice(0, 200);
      throw new Error(`instagram: ${method} ${path.replace(userId, '<id>')} failed, HTTP ${res.status}: ${msg.split(token).join('***')}`);
    }
    return json;
  };
  const ready = async id => {
    for (let i = 0; i < 12; i++) {
      const s = await call('GET', `/${id}`, { fields: 'status_code' });
      if (s.status_code === 'FINISHED') return;
      if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`instagram: picture ${id} ${s.status_code}`);
      await sleep(wait);
    }
    throw new Error(`instagram: picture ${id} still not ready after waiting`);
  };

  const q = await call('GET', `/${userId}/content_publishing_limit`, { fields: 'quota_usage,config' });
  const row = (q.data || [])[0] || {};
  if (row.config && row.config.quota_total && row.quota_usage >= row.config.quota_total) throw new Error(`instagram: daily post limit reached (${row.quota_usage} of ${row.config.quota_total})`);

  let creation;
  if (post.images.length === 1) {
    creation = (await call('POST', `/${userId}/media`, { image_url: post.images[0].url, caption: post.caption || '' })).id;
  } else {
    const kids = [];
    for (const im of post.images) kids.push((await call('POST', `/${userId}/media`, { image_url: im.url, is_carousel_item: 'true' })).id);
    for (const k of kids) await ready(k);
    creation = (await call('POST', `/${userId}/media`, { media_type: 'CAROUSEL', children: kids.join(','), caption: post.caption || '' })).id;
  }
  await ready(creation);
  const pub = await call('POST', `/${userId}/media_publish`, { creation_id: creation });
  let link = '';
  try { link = (await call('GET', `/${pub.id}`, { fields: 'permalink' })).permalink || ''; } catch (e) { log('  (posted, but the link could not be read)'); }
  return { id: pub.id, link };
}

module.exports = { id: 'instagram', check, publish, MAX_CAPTION, MAX_IMAGES, API };
