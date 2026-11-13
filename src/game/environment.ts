export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Weather = 'sunny' | 'cloudy' | 'rainy'
export type DayPhase = 'morning' | 'day' | 'dusk' | 'night'

export interface Environment {
  month: number
  hour: number
  dateKey: string
  season: Season
  weather: Weather
  phase: DayPhase
}

export function getEnvironment(date = new Date()): Environment {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const value = (name: string) => parts.find(part => part.type === name)?.value ?? '0'
  const month = Number(value('month'))
  const hour = Number(value('hour'))
  const dateKey = `${value('year')}-${value('month')}-${value('day')}`
  const season: Season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter'
  const hash = [...dateKey].reduce((n, char) => (n * 31 + char.charCodeAt(0)) >>> 0, 7)
  const weather: Weather = hash % 7 === 0 ? 'rainy' : hash % 7 <= 2 ? 'cloudy' : 'sunny'
  const phase: DayPhase = hour < 6 || hour >= 20 ? 'night' : hour < 9 ? 'morning' : hour < 17 ? 'day' : 'dusk'
  return { month, hour, dateKey, season, weather, phase }
}

export const seasonNames: Record<Season, string> = { spring: '春日', summer: '盛夏', autumn: '秋日', winter: '冬日' }
export const weatherNames: Record<Weather, string> = { sunny: '晴朗', cloudy: '多云', rainy: '小雨' }
export const phaseNames: Record<DayPhase, string> = { morning: '清晨', day: '白昼', dusk: '黄昏', night: '夜晚' }

export function outdoorPalette(env: Environment) {
  const sets: Record<Season, { grass: number; grass2: number; leaf: number; flower: number }> = {
    spring: { grass: 0x829d69, grass2: 0x78945f, leaf: 0x91aa6d, flower: 0xf0aaa8 },
    summer: { grass: 0x6e9861, grass2: 0x648d57, leaf: 0x5f8955, flower: 0xf3ce76 },
    autumn: { grass: 0x9a9864, grass2: 0x8d8a59, leaf: 0xbd8050, flower: 0xe6b972 },
    winter: { grass: 0x9daaa0, grass2: 0x929e96, leaf: 0x879b87, flower: 0xecebdc },
  }
  return sets[env.season]
}
