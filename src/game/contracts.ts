/** Phase-one boundaries for later features. No services or UI are attached yet. */
export interface PlayerProfile { id: string; role: 'sister' | 'visitor'; displayName: string }
export interface CharacterAppearance { spriteSheetUrl: string; frameWidth: number; frameHeight: number }
export interface NpcController { update(deltaMs: number): void; dispose(): void }
export interface Interaction { id: string; canStart(): boolean; start(): Promise<void> }
export interface MemoryEntry { id: string; kind: 'diary' | 'photo' | 'easter-egg'; createdAt: string }
export interface SaveAdapter { load(profileId: string): Promise<unknown>; save(profileId: string, state: unknown): Promise<void> }
