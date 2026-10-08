// The contract every platform adapter (artifact, web, later desktop and mobile) must meet.
export interface Kv { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void; keys(): string[] }
// Async record store for small documents (projects, stamp library). Keys are strings; values are JSON-safe.
export interface Records { get(k: string): Promise<unknown | null>; put(k: string, v: unknown): Promise<void>; del(k: string): Promise<void>; list(): Promise<string[]> }
// Large files (images, fonts, exported zips).
export interface Blobs { put(name: string, data: Blob): Promise<void>; get(name: string): Promise<Blob | null>; del(name: string): Promise<void>; list(): Promise<string[]> }
// Save/open as the user expects: a real Save on browsers that allow it, a download otherwise.
export interface Files { save(name: string, data: Blob, opts?: { type?: string }): Promise<'saved' | 'downloaded'>; canSave(): boolean }
export interface Adapter { kv: Kv; records: Records; blobs: Blobs; files: Files }
