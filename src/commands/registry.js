// The command registry: every user action is a named command (id, label, shortcut, enabled check, run). Menus, the shortcut
// table, command search (Mod+K, later) and a future native menu bar all read from here. Pure: no DOM, no work on import.
// Shortcut syntax: "Mod+Shift+Z", "G", "\\". "Mod" is Cmd on Mac and Ctrl elsewhere. A command may carry a separate
// `desktopShortcut` for keys a browser tab keeps for itself (Mod+N, Mod+W, Mod+T).
const CMDS = new Map();

function cmdRegister(c) {
  if (!c || typeof c.id !== 'string' || !c.id) throw new Error('A command needs an id');
  if (CMDS.has(c.id)) throw new Error('Command registered twice: ' + c.id);
  if (typeof c.run !== 'function') throw new Error('Command has no run(): ' + c.id);
  if (typeof c.label !== 'string' || !c.label) throw new Error('Command has no label: ' + c.id);
  CMDS.set(c.id, { enabled: () => true, ...c });
  return c.id;
}
const cmdGet = id => CMDS.get(id) || null;
const cmdList = () => [...CMDS.values()];
const cmdIsEnabled = id => { const c = CMDS.get(id); return !!c && !!c.enabled(); };
// Runs a command if it exists and is enabled. Returns true when it ran. Errors from run() propagate to the caller.
function cmdRun(id, ...args) {
  const c = CMDS.get(id);
  if (!c || !c.enabled()) return false;
  c.run(...args);
  return true;
}
// How a shortcut reads on this platform: "Cmd+Shift+Z" / "Ctrl+Shift+Z".
function cmdFormatShortcut(s, isMac) {
  if (!s) return '';
  return s.split('+').map(p => p === 'Mod' ? (isMac ? 'Cmd' : 'Ctrl') : p).join('+');
}
// Which commands claim the same shortcut (used by the tests to keep the table honest).
function cmdConflicts() {
  const seen = new Map(), bad = [];
  for (const c of CMDS.values()) for (const s of [c.shortcut, c.desktopShortcut].filter(Boolean)) {
    const k = s.toLowerCase();
    if (seen.has(k) && seen.get(k) !== c.id) bad.push([s, seen.get(k), c.id]); else seen.set(k, c.id);
  }
  return bad;
}
export {cmdRegister,cmdGet,cmdList,cmdIsEnabled,cmdRun,cmdFormatShortcut,cmdConflicts};
