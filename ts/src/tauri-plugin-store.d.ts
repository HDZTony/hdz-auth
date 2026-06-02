/** Stub for optional peer @tauri-apps/plugin-store (web/uni consumers skip install). */
declare module '@tauri-apps/plugin-store' {
  export function load(
    path: string,
    options?: { autoSave?: boolean; defaults?: Record<string, unknown> },
  ): Promise<{
    get<T>(key: string): Promise<T | null>
    set(key: string, value: unknown): Promise<void>
    delete(key: string): Promise<void>
    save(): Promise<void>
  }>
}
