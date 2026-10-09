// A problem with a project file that the person can be told about in plain words. Never a blank app: callers show e.message.
class FormatError extends Error {
  constructor(code, message) { super(message); this.name = 'FormatError'; this.code = code; }
}
export {FormatError};
