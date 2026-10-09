import {cmdRegister} from '../commands/registry.js';
import {$} from './01-launch-and-version.js';
// ===== The app's commands =====
// Each command does exactly what clicking its button does, so menus, shortcuts and (later) command search can never drift
// apart. `shortcut` documents the key that already works today; the key handler in 34-desktop-shell looks the key up here and calls the command's run(), with the same conditions as before (Phases 1-3 are
// bug-for-bug). A command is enabled when its button exists, is visible and is not disabled.
const el = id => () => $(id);
const usable = id => () => { const b = $(id); return !!b && !b.hidden && !b.disabled; };
const click = id => () => $(id).click();
const COMMANDS = [
  ['edit.undo', 'Undo', 'undo', 'Mod+Z'],
  ['edit.redo', 'Redo', 'redo', 'Mod+Shift+Z'],
  ['stamp.duplicateMotif', 'Duplicate motif', 'scp', 'Mod+D'],
  ['stamp.deleteMotif', 'Delete motif', 'sdl', 'Delete'],
  ['stamp.split', 'Split motif', 'ssp', 'S'],
  ['stamp.knockout', 'Knock out', 'sko', 'K'],
  ['file.projects', 'Projects', 'pls'],
  ['file.new', 'New project', 'pnw'],
  ['file.clear', 'Clear canvas', 'clr'],
  ['file.duplicate', 'Duplicate project', 'pcp'],
  ['file.open', 'Open project file', 'pfile', null, 'input'],
  ['file.download', 'Download project file', 'pdl'],
  ['file.save', 'Save', 'psv', 'Mod+S'],
  ['file.exportEverything', 'Export everything', 'xall'],
  ['file.importEverything', 'Import everything', 'xallf', null, 'input'],
  ['export.png', 'Export PNG', 'png'],
  ['export.svg', 'Export SVG', 'sv'],
  ['export.copySvg', 'Copy SVG', 'cpy'],
  ['file.restoreRecovery', 'Restore unsaved work', 'rcv'],
  ['file.dismissRecovery', 'Dismiss recovered work', 'rcx'],
  ['library.importStamp', 'Import stamp file', 'slimp'],
  ['view.theme', 'Switch light / dark', 'thm'],
  ['view.zoomIn', 'Zoom in', 'zi'],
  ['view.zoomOut', 'Zoom out', 'zo'],
  ['view.fit', 'Fit to screen', 'zl'],
  ['view.before', 'Before', 'bab', '\\'],
  ['view.split', 'Split view', 'bas', 'Shift+\\'],
  ['view.grid', 'Show grid', 'gtg', 'G'],
  ['panels.closeAll', 'Close all panels', 'rcls'],
  ['panel.canvas', 'Open Canvas', 'rail-canvas'],
  ['panel.colors', 'Open Colors', 'rail-colors'],
  ['panel.stamp', 'Open Stamp', 'rail-stamp'],
  ['panel.slib', 'Open Stamp library', 'rail-slib'],
  ['panel.motifs', 'Open Motifs', 'rail-motifs'],
  ['panel.text', 'Open Text', 'rail-text'],
  ['panel.grid', 'Open Grid', 'rail-grid'],
  ['panel.preview', 'Open Pattern preview', 'rail-preview'],
  ['panel.mlist', 'Open Motif list', 'rail-mlist'],
  ['panel.lyrs', 'Open Layers', 'rail-lyrs'],
  ['panel.layers', 'Open Arrangement', 'rail-layers'],
  ['panel.pgrid', 'Open Pattern grid', 'rail-pgrid'],
  ['panel.grade', 'Open Color grading', 'rail-grade'],
  ['panel.tex', 'Open Textures', 'rail-tex'],
  ['panel.rand', 'Open Randomize', 'rail-rand'],
  ['panel.hist', 'Open History', 'rail-hist'],
  ['randomize.roll', 'Randomize now', 'rzdo'],
  ['app.commandSearch', 'Search commands', 'cmdkb', 'Mod+K'],
];
function init37() {
  for (const [id, label, elId, shortcut, kind] of COMMANDS) {
    cmdRegister({id, label, shortcut: shortcut || undefined, elId,
      // file inputs are opened by clicking them (that is what their visible label does); they are hidden on purpose
      enabled: kind === 'input' ? el(elId) : usable(elId),
      run: click(elId)});
  }
}
export {init37};
