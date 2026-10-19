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
  ['panel.nav', 'Open Navigator', 'rail-nav'],
  ['panel.wspc', 'Open Workspaces', 'rail-wspc'],
  ['workspace.save', 'Save workspace', 'wxsave'],
  ['panel.xrec', 'Open Export recipes', 'rail-xrec'],
  ['view.tileRepeat', 'Repeat tile: show 3 × 3', 'tpv'],
  ['export.now', 'Export with the recipe settings', 'xrnow'],
  ['export.allRecipes', 'Export all recipes as one zip', 'xrall'],
  ['panel.pres', 'Open Presets', 'rail-pres'],
  ['look.save', 'Save look', 'pssave'],
  ['panel.vars', 'Open Variations', 'rail-vars'],
  ['variations.more', 'More variations', 'vrmore'],
  ['export.proofPdf', 'Print proof (PDF)', 'xppdf'],
  ['export.proofPng', 'Print proof (PNG)', 'xppng'],
  ['view.before', 'Before', 'bab', '\\'],
  ['view.split', 'Split view', 'bas', 'Shift+\\'],
  ['view.grid', 'Show grid', 'gtg', 'G'],
  ['panels.closeAll', 'Close all panels', 'rcls'],
  ['panel.canvas', 'Open Canvas', 'rail-canvas'],
  ['panel.colors', 'Open Colours', 'rail-colors'],
  ['panel.cways', 'Open Colourways', 'rail-cways'],
  ['colourway.new', 'New colourway', 'cwnew'],
  ['colourway.exportAll', 'Export all colourways', 'cwgo'],
  ['tray.add', 'Add a colour to the tray', 'tyaddl'],
  ['tray.save', 'Save tray', 'tysave'],
  ['panel.stamp', 'Open Stamp settings', 'rail-stamp'],
  ['panel.slib', 'Open Stamp library', 'rail-slib'],
  ['panel.motifs', 'Open Shapes', 'rail-motifs'],
  ['panel.text', 'Open Text', 'rail-text'],
  ['panel.grid', 'Open Grid', 'rail-grid'],
  ['panel.preview', 'Open Pattern preview', 'rail-preview'],
  ['panel.mlist', 'Open Shape list', 'rail-mlist'],
  ['panel.sedit', 'Open Element editor', 'rail-sedit'],
  ['panel.lyrs', 'Open Layers', 'rail-lyrs'],
  ['panel.layers', 'Open Layout', 'rail-layers'],
  ['panel.stmp', 'Open Stamps', 'rail-stmp'],
  ['panel.pgrid', 'Open Grid', 'rail-pgrid'],
  ['panel.grade', 'Open Colour grading', 'rail-grade'],
  ['panel.tex', 'Open Textures', 'rail-tex'],
  ['panel.rand', 'Open Randomize', 'rail-rand'],
  ['panel.hist', 'Open History', 'rail-hist'],
  ['library.exportShapes', 'Export shapes (SVG zip)', 'fexp'],
  ['library.toggleFolders', 'Expand or collapse all shape folders', 'ltog'],
  ['library.newFolder', 'New shape folder', 'fnew'],
  ['library.importImage', 'Import a shape from an image', 'ifile', null, 'input'],
  ['library.importSheet', 'Import a sheet of shapes', 'sfile', null, 'input'],
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
