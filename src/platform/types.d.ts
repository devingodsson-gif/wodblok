// The contract every platform adapter (artifact, web, later desktop and mobile) must meet.
export interface Kv { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void; keys(): string[] }
// Async record store for small documents (projects, stamp library). Keys are strings; values are JSON-safe.
export interface Records { get(k: string): Promise<unknown | null>; put(k: string, v: unknown): Promise<void>; del(k: string): Promise<void>; list(): Promise<string[]> }
// Large files (images, fonts, exported zips).
export interface Blobs { put(name: string, data: Blob): Promise<void>; get(name: string): Promise<Blob | null>; del(name: string): Promise<void>; list(): Promise<string[]> }
// Save/open as the user expects: a real Save on browsers that allow it, a download otherwise.
export interface Files {
  save(name: string, data: Blob, opts?: { type?: string }): Promise<'saved' | 'downloaded'>; canSave(): boolean;
  write(name: string, data: Blob, opts?: { type?: string; handle?: unknown }): Promise<{ how: 'saved' | 'downloaded'; handle: unknown | null }>;
  canOpen(): boolean; open(): Promise<{ file: File; handle: unknown } | null>; onLaunch(cb: (file: File, handle: unknown) => void): void;
}
// Offline use and updates (the web app's service worker). Absent in the artifact and desktop adapters.
export interface Offline { available(): boolean; register(onWaiting: () => void): Promise<void>; apply(): Promise<void> }
// Browser storage: keep-my-data request and usage.
export interface Storage { available(): boolean; persist(): Promise<boolean>; persisted(): Promise<boolean>; estimate(): Promise<{ used: number; quota: number }> }
export interface Adapter { kv: Kv; records: Records; blobs: Blobs; files: Files }
