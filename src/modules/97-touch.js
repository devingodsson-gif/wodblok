import {WBS,WBX} from './01-launch-and-version.js';
import {drOff} from './02-draft-mode-speedups.js';
// ===== Touch on a phone (2.80.1, owner Oct 31 2026, docs/mobile-touch-plan.md) =====
// Everything here works only in the narrow layout on a touch screen (the `wbtouch` class on <html>); a desktop window and a mouse keep their own behaviour.
const NARROW = '(max-width:860px)';
const isTouchPhone = () => { try { return matchMedia(NARROW).matches && (navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches); } catch (e) { return false; } };
function touchMark() { const on = isTouchPhone(), h = document.documentElement; if (h.classList.contains('wbtouch') !== on) h.classList.toggle('wbtouch', on); }
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

function init97() {
  touchMark(); addEventListener('resize', touchMark);
  touchSliders();
}
export {init97,wbTouch};
