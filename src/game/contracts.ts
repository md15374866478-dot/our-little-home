/** Boundaries for later account and save features. No service is connected yet. */
export interface PlayerProfile { id: string; role: 'mashuo' | 'visitor'; displayName: string }
export function migratePlayerProfile(profile: { id: string; role: string; displayName: string }): PlayerProfile | undefined {
  const role = profile.role === 'sister' ? 'mashuo' : profile.role
  return role === 'mashuo' || role === 'visitor' ? { ...profile, role } : undefined
}
export interface CharacterAppearance { spriteSheetUrl: string; frameWidth: number; frameHeight: number }
export interface MemoryEntry { id: string; kind: 'diary' | 'photo' | 'easter-egg'; createdAt: string }
export interface SaveAdapter { load(profileId: string): Promise<unknown>; save(profileId: string, state: unknown): Promise<void> }
