import {WBS,WBX} from './01-launch-and-version.js';
import {drOff} from './02-draft-mode-speedups.js';
import {ICN} from './00-icons.js';
import {stUnlocked} from './63-stamp-tool.js';
import {cmdRun} from '../commands/registry.js';
// ===== Touch on a phone (2.80.1, owner Oct 31 2026, docs/mobile-touch-plan.md) =====
// Everything here works only in the narrow layout on a touch screen (the `wbtouch` class on <html>); a desktop window and a mouse keep their own behaviour.
const NARROW = '(max-width:860px)';
const isTouchPhone = () => { try { return matchMedia(NARROW).matches && (navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches); } catch (e) { return false; } };
let tsbKick = () => {};
function touchMark() { const on = isTouchPhone(), h = document.documentElement; if (h.classList.contains('wbtouch') !== on) h.classList.toggle('wbtouch', on); if (on) tsbKick(); }
const wbTouch = () => document.documentElement.classList.contains('wbtouch');

// Sliders: in `wbtouch` a slider takes no touch of its own (CSS); a finger that goes sideways first drags its value from where it was, a finger that goes up or down
// first is left to scroll the panels, and a tap changes nothing. One `change` when the finger lifts, as a slider's own drag gives.
const SL_GO = 8;
function sliderAt(x, y, t) {
  const pad = 10, near = (r) => r.width > 0 && x >= r.left - 4 && x <= r.right + 4 && y >= r.top - pad && y <= r.bottom + pad;
  for (let n = t, i = 0; n && i < 4; n = n.parentElement, i++) {
    if (!n.querySelectorAll) continue;
    for (const r of n.querySelectorAll('input[type=range]')) if (!r.disabled && near(r.getBoundingClientRect())) return r;
  }
  return null;
}
function touchSliders() {
  let d = null;
  const val = (r, v) => { const mn = +r.min || 0, mx = r.max === '' ? 100 : +r.max, st = r.step === 'any' ? 0 : (+r.step || 1); v = Math.min(mx, Math.max(mn, v)); if (st) v = mn + Math.round((v - mn) / st) * st; return +v.toFixed(6); };
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || !wbTouch() || d) return;
    const r = sliderAt(e.clientX, e.clientY, e.target); if (!r) return;
    d = { r, id: e.pointerId, x: e.clientX, y: e.clientY, v0: +r.value, on: false, w: Math.max(1, r.getBoundingClientRect().width) };
  }, true);
  document.addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on) { if (Math.abs(dy) >= SL_GO && Math.abs(dy) > Math.abs(dx)) { d = null; return; } if (Math.abs(dx) < SL_GO) return; d.on = true; d.x = e.clientX; if (!WBS.NODR) { WBS.DRAFT = 1; WBS.DRAFTCV = 0; } WBX.wbNoCap = 1; }   // drawn as a draft while it moves (02), one History step when the finger lifts (as the colour picker's drag)
    const r = d.r, mn = +r.min || 0, mx = r.max === '' ? 100 : +r.max, v = val(r, d.v0 + (e.clientX - d.x) / d.w * (mx - mn));
    if (+r.value !== v) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }
    e.preventDefault();
  }, { capture: true, passive: false });
  const end = e => { if (!d || e.pointerId !== d.id) return; const x = d; d = null; if (!x.on) return; WBX.wbNoCap = 0; if (+x.r.value !== x.v0) { x.r.dispatchEvent(new Event('change', { bubbles: true })); if (WBX.wbCap) WBX.wbCap(); } drOff(); };
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', end, true);
}

// The canvas (2.80.2): in `wbtouch` the board takes every touch itself (CSS touch-action:none) and a first finger is held for a moment before the editor sees it,
// so a second finger can still make it a two-finger gesture: pinch and drag move the view, or, started on a selected element, size and turn it.
// A finger that moves or stays is passed on as it was (a tap selects, a drag moves), to what is exactly under it (the browser's own touch adjustment would
// give a small element's handles every touch on it); outside the selection a handle takes a touch from HD_NEAR px round it. With a shape, stamp, text or
// copy on the finger, the finger shows where it goes and it is placed where the finger lifts.
const HOLD_MS = 90, HOLD_GO = 6, HD_NEAR = 22;
const UI = 'button,input,select,textarea,a,label,[contenteditable],.viewbar,#tbar,.stt,.sltb';
const HANDLES = '#art [data-fh],#stoh .steh[data-hd],#stoh .steh[data-sp]';
const pe = (type, src, o = {}) => new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: src.pointerId, pointerType: 'touch', isPrimary: true, clientX: src.clientX, clientY: src.clientY, screenX: src.screenX, screenY: src.screenY, button: 0, buttons: type === 'pointerup' ? 0 : 1, width: src.width, height: src.height, pressure: type === 'pointerup' ? 0 : .5, ...o });
function nearHandle(x, y, t) {
  if (t && t.closest && t.closest('[data-fh],.steh[data-hd],.steh[data-sp]')) return null;
  for (const b of document.querySelectorAll('#fpov rect.sel,#stoh polygon.stes')) { const r = b.getBoundingClientRect(); if (x > r.left && x < r.right && y > r.top && y < r.bottom) return null; }   // on the selection itself a finger moves it
  let best = null, bd = HD_NEAR;
  document.querySelectorAll(HANDLES).forEach(h => { const r = h.getBoundingClientRect(); if (!r.width && !r.height) return; const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)); if (d < bd) { bd = d; best = h; } });
  return best;
}
function touchCanvas() {
  const board = document.getElementById('boardP'); if (!board) return () => false;
  const P = new Map();   // the touches on the board: id -> {x, y}
  let one = null, two = null, swallow = new Set();
  const armed = () => { const k = WBX.plKind ? WBX.plKind() : ''; return !!k && k !== 'paint'; };
  const pass = (o, ev) => { if (o.passed) return; const t = nearHandle(ev.clientX, ev.clientY, o.t) || o.t; o.passed = true; clearTimeout(o.tm); t.dispatchEvent(pe('pointerdown', o.down)); };
  const stop = e => { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); };
  const sliders = (x, y) => { if (armed() || !WBX.wbWheelXf) return null; const t = WBX.wbWheelXf({ clientX: x, clientY: y }); return t ? { s: document.getElementById(t.s), r: document.getElementById(t.r) } : null; };
  const geo = () => { const [a, b] = [...P.values()]; return { d: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), a: Math.atan2(b.y - a.y, b.x - a.x), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || !e.isTrusted || !wbTouch()) return;
    const t = e.target; if (!t || !t.closest || !board.contains(t) || t.closest(UI)) return;
    P.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (P.size === 1) {
      stop(e); const o = one = { id: e.pointerId, t: board.contains(document.elementFromPoint(e.clientX, e.clientY)) ? document.elementFromPoint(e.clientX, e.clientY) : t, down: e, x: e.clientX, y: e.clientY, armed: armed(), passed: false };
      if (!o.armed) o.tm = setTimeout(() => { if (one === o && !two && !o.passed) pass(o, o.down); }, HOLD_MS);
      return;
    }
    stop(e);
    if (P.size === 2 && one && !one.passed && !two) {   // two fingers: a gesture, the first finger's press is dropped
      clearTimeout(one.tm); const g = geo(), [a] = [...P.values()];
      two = { g0: g, z0: WBX.wbZoomNow ? WBX.wbZoomNow() : 1, sl: sliders(a.x, a.y), sl0: null, ids: new Set(P.keys()) };
      if (two.sl) { two.sl0 = [+two.sl.s.value, +two.sl.r.value]; WBX.wbNoCap = 1; }
      return;
    }
    swallow.add(e.pointerId);   // a third finger, or a second once the first is at work
  }, true);
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'touch' || !e.isTrusted || !P.has(e.pointerId)) return;
    P.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (swallow.has(e.pointerId)) { stop(e); return; }
    if (two) {
      stop(e); if (P.size < 2) return;
      const g = geo(), k = g.d / two.g0.d;
      if (two.sl) {
        const { s, r } = two.sl, sv = Math.min(+s.max, Math.max(+s.min, Math.round(two.sl0[0] * k))), rv = Math.round(((two.sl0[1] + (g.a - two.g0.a) * 180 / Math.PI) + 180) % 360 + 360) % 360 - 180;
        if (+s.value !== sv) { s.value = sv; s.dispatchEvent(new Event('input', { bubbles: true })); }
        if (+r.value !== rv) { r.value = rv; r.dispatchEvent(new Event('input', { bubbles: true })); }
      } else {
        if (WBX.wbZoomAt) WBX.wbZoomAt(two.z0 * k, g.x, g.y);
        board.scrollLeft -= g.x - (two.px != null ? two.px : two.g0.x); board.scrollTop -= g.y - (two.py != null ? two.py : two.g0.y);
        two.px = g.x; two.py = g.y;
      }
      return;
    }
    const o = one; if (!o || o.id !== e.pointerId || o.passed) return;
    if (o.armed) return;   // the shape on the finger follows it (the editor's own hover)
    if (Math.hypot(e.clientX - o.x, e.clientY - o.y) >= HOLD_GO) pass(o, o.down); else stop(e);
  }, { capture: true, passive: false });
  const up = e => {
    if (e.pointerType !== 'touch' || !e.isTrusted || !P.has(e.pointerId)) return;
    P.delete(e.pointerId);
    if (swallow.has(e.pointerId)) { swallow.delete(e.pointerId); stop(e); return; }
    if (two) {
      stop(e);
      if (two.sl && two.ids.has(e.pointerId) && !two.done) { two.done = true; WBX.wbNoCap = 0; const { s, r } = two.sl; if (+s.value !== two.sl0[0]) s.dispatchEvent(new Event('change', { bubbles: true })); if (+r.value !== two.sl0[1]) r.dispatchEvent(new Event('change', { bubbles: true })); if (WBX.wbCap) WBX.wbCap(); }
      if (!P.size) { two = null; one = null; }
      return;
    }
    const o = one; if (!o || o.id !== e.pointerId) return; one = null; clearTimeout(o.tm);
    if (o.passed) return;   // the editor has had the press: its lift goes on to it
    stop(e);
    if (e.type === 'pointercancel') return;
    const t = o.armed ? (document.elementFromPoint(e.clientX, e.clientY) || o.t) : (nearHandle(o.x, o.y, o.t) || o.t);
    const at = o.armed ? e : o.down;   // placed where the finger lifts; a tap where it touched
    t.dispatchEvent(pe('pointerdown', at)); t.dispatchEvent(pe('pointerup', at));   // the touch's own click follows
  };
  addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
  // 2.81.1 (owner Oct 31 2026: "it deselects and nothing is created"): a finger held on the canvas makes the phone send a long press (contextmenu), which the
  // editor takes for a right click and puts away what is on the cursor. On a phone the canvas has no long press: the selection bar does that menu's work
  addEventListener('contextmenu', e => { if (wbTouch() && e.target && e.target.closest && board.contains(e.target)) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  return () => P.size > 0;   // a finger is on the canvas
}

// The selection bar (2.80.3, owner Oct 31 2026: "yes"): on a phone a small bar over the selection with Rotate 90°, Flip, Duplicate and Delete, so they need no
// trip down to the panel. It shows while something is selected and no finger is on the canvas, above the selection (below it when there is no room).
const TSB = [['rot', 'Rotate 90°', 'rotateCw'], ['flip', 'Flip', 'flip'], ['dup', 'Duplicate', 'duplicate'], ['del', 'Delete', 'trash']];
function tsbRun(a) {
  const tab = stUnlocked() != null;
  if (a == 'dup' || a == 'del') { if (WBX.wbEmAct) WBX.wbEmAct(a); return; }
  if (!tab) { cmdRun(a == 'rot' ? 'element.rotateCw' : 'element.flip'); return; }
  if (a == 'flip') { const b = document.getElementById('sfl'); if (b) b.click(); return; }
  const r = document.getElementById('srt'); if (!r) return;
  r.value = ((+r.value + 90 + 180) % 360 + 360) % 360 - 180; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true }));
}
function selRect() {
  const bs = [...document.querySelectorAll(stUnlocked() != null ? '#stoh polygon.stes' : '#fpov rect.sel')].map(b => b.getBoundingClientRect()).filter(r => r.width || r.height);
  if (!bs.length) return null;
  return { l: Math.min(...bs.map(r => r.left)), t: Math.min(...bs.map(r => r.top)), r: Math.max(...bs.map(r => r.right)), b: Math.max(...bs.map(r => r.bottom)) };
}
function touchSelBar(busy) {
  const bar = document.createElement('div'); bar.className = 'tsb'; bar.id = 'tsb'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Selection'); bar.hidden = true;
  bar.innerHTML = TSB.map(([a, n, ic]) => `<button type="button" class="ib" data-a="${a}" aria-label="${n}"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ICN[ic] || ''}</svg></button>`).join('');
  document.body.appendChild(bar);
  bar.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) tsbRun(b.dataset.a); });
  const board = document.getElementById('boardP');
  const place = () => {
    const R = wbTouch() && !busy() && board && !board.classList.contains('off') ? selRect() : null, B = board && board.getBoundingClientRect();
    const on = !!R && R.b > B.top && R.t < B.bottom;
    if (bar.hidden === on) bar.hidden = !on;
    if (on) {
      const w = bar.offsetWidth, h = bar.offsetHeight, gap = 10, vw = document.documentElement.clientWidth;
      let y = R.t - gap - h; if (y < Math.max(B.top, 0) + 4) y = R.b + gap;
      const x = Math.round(Math.max(8, Math.min(vw - w - 8, (R.l + R.r) / 2 - w / 2))), yy = Math.round(y);
      if (bar._x !== x || bar._y !== yy) { bar._x = x; bar._y = yy; bar.style.left = x + 'px'; bar.style.top = yy + 'px'; }
    }
    if (wbTouch()) requestAnimationFrame(place); else loop = false;   // it follows the selection frame by frame on a phone only
  };
  let loop = false; tsbKick = () => { if (!loop && wbTouch()) { loop = true; requestAnimationFrame(place); } }; tsbKick();
}

function init97() {
  touchMark(); addEventListener('resize', touchMark);
  touchSliders(); touchSelBar(touchCanvas());
}
export {init97,wbTouch};
