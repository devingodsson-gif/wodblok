import {cmdRegister} from '../commands/registry.js';
import {$} from './01-launch-and-version.js';
// ===== The app's commands =====
// Each command does exactly what clicking its button does, so menus, shortcuts and (later) command search can never drift
// apart. `shortcut` documents the key that already works today; the key handler in 34-desktop-shell looks the key up here and calls the command's run(), with the same conditions as before (Phases 1-3 are
// bug-for-bug). A command is enabled when its button exists, is visible and is not disabled.
const el = id => () => $(id);
const usable = id => () => { const b = $(id); return !!b && !b.hidden && !b.disabled; };
// the element panels have no rail button on screen (the element bar opens them), but their commands still click it
const ELBTN = new Set(['rail-layers', 'rail-stmp', 'rail-motifs', 'rail-text', 'rail-elpaint', 'rail-mlist']);
const exists = id => () => { const b = $(id); return !!b && !b.disabled; };
const click = id => () => $(id).click();
const COMMANDS = [
  ['edit.undo', 'Undo', 'undo', 'Mod+Z'],
  ['edit.redo', 'Redo', 'redo', 'Mod+Shift+Z'],
  ['stamp.duplicateMotif', 'Duplicate shape', 'scp', 'Mod+D'],
  ['stamp.deleteMotif', 'Delete shape', 'sdl', 'Delete'],
  ['stamp.split', 'Split shape', 'ssp', 'S'],
  ['stamp.knockout', 'Knock out', 'sko', 'K'],
  ['file.projects', 'Projects folder', 'pls'],
  ['file.new', 'New project', 'pnw'],
  ['file.clear', 'Clear canvas', 'clr'],
  ['template.new', 'New from template', 'tpnew'],
  ['template.save', 'Save as template', 'tpsave'],
  ['settings.open', 'Settings', 'stgo'],
  ['file.open', 'Open project', 'pfile', null, 'input'],
  ['file.save', 'Save project', 'psv', 'Mod+S'],
  ['export.png', 'Export PNG', 'png'],
  ['export.svg', 'Export SVG', 'sv'],
  ['export.copySvg', 'Copy SVG', 'cpy'],
  ['file.restoreRecovery', 'Restore unsaved work', 'rcv'],
  ['file.dismissRecovery', 'Dismiss recovered work', 'rcx'],
  ['library.importStamp', 'Import stamp file', 'slimp'],
  ['view.theme', 'Switch light / dark', 'thm'],
  ['view.zoomIn', 'Zoom in', 'zi', '+'],
  ['view.zoomOut', 'Zoom out', 'zo', '-'],
  ['view.fit', 'Fit to screen', 'zl', '0'],
  ['view.actualSize', 'Zoom to 100%', 'nv100', '1'],
  ['view.hand', 'Hand tool (drag to move the picture)', 'nvhand', 'H'],
  ['panel.xrec', 'Open Export recipes', 'rail-xrec'],
  ['view.tileRepeat', 'Repeat tile: show 3 × 3', 'tpv'],
  ['export.now', 'Export with the recipe settings', 'xrnow'],
  ['export.allRecipes', 'Export all recipes as one zip', 'xrall'],
  ['export.proofPdf', 'Print proof (PDF)', 'xppdf'],
  ['export.proofPng', 'Print proof (PNG)', 'xppng'],
  ['view.before', 'Before', 'bab', '\\'],
  ['view.split', 'Split view', 'bas', 'Shift+\\'],
  ['view.grid', 'Show grid', 'pgs', 'G'],
  ['panels.closeAll', 'Close all panels', 'rcls'],
  ['panel.canvas', 'Open Canvas', 'rail-canvas'],
  ['panel.colors', 'Open Colours', 'rail-colors'],
  ['colourway.new', 'New colourway', 'cwnew'],
  ['colourway.exportAll', 'Export all colourways', 'cwgo'],
  ['tray.add', 'Add a colour to the tray', 'tyaddl'],
  ['tray.save', 'Save tray', 'tysave'],
  ['panel.motifs', 'Open Shape', 'rail-motifs'],
  ['panel.text', 'Open Text', 'rail-text'],
  ['panel.mlist', 'Open Element', 'rail-mlist'],
  ['panel.elpaint', 'Open Paint', 'rail-elpaint'],
  ['panel.lyrs', 'Open Elements', 'rail-lyrs'],
  ['panel.layers', 'Open Pattern', 'rail-layers'],
  ['panel.stmp', 'Open Stamp', 'rail-stmp'],
  ['stamp.new', 'New stamp', 'smknew'],
  ['stamp.duplicate', 'Duplicate stamp', 'smkdup'],
  ['stamp.delete', 'Delete stamp', 'smkdel'],
  ['stamp.zoom', 'Zoom to stamp', 'smkzoom'],
  ['stamp.saveToLibrary', 'Save stamp to library', 'smksave'],
  ['panel.pgrid', 'Open Grid', 'rail-pgrid'],
  ['panel.rand', 'Open Randomize', 'rail-rand'],
  ['panel.hist', 'Open History', 'rail-hist'],
  ['library.exportShapes', 'Export motifs (SVG zip)', 'fexp'],
  ['library.toggleFolders', 'Expand or collapse all shape folders', 'ltog'],
  ['library.newFolder', 'New shape folder', 'fnew'],
  ['library.importImage', 'Import a shape from an image', 'ifile', null, 'input'],
  ['library.importSheet', 'Import a sheet of motifs', 'sfile', null, 'input'],
  ['randomize.roll', 'Randomize now', 'rzdo'],
  ['app.commandSearch', 'Search commands', 'cmdkb', 'Mod+K'],
];
function init37() {
  for (const [id, label, elId, shortcut, kind] of COMMANDS) {
    cmdRegister({id, label, shortcut: shortcut || undefined, elId,
      // file inputs are opened by clicking them (that is what their visible label does); they are hidden on purpose
      enabled: kind === 'input' ? el(elId) : ELBTN.has(elId) ? exists(elId) : usable(elId),
      run: click(elId)});
  }
}
export {init37};
