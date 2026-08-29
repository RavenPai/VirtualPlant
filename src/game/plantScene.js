import { timeOfDay } from './engine'

export function isNightScene(weather, tod = timeOfDay()) {
  if (weather && typeof weather.isDay === 'boolean') return !weather.isDay
  return tod === 'night' || tod === 'dusk'
}

export function sceneWeather(kind) {
  if (kind === 'rain') return 'rain'
  if (kind === 'snow') return 'snow'
  return 'clear'
}

export function plantBackgroundSrc({ weatherKind, weather, timeOfDay: tod } = {}) {
  const sky = sceneWeather(weatherKind)
  const night = isNightScene(weather, tod)
  return `/backgrounds/${sky}-${night ? 'night' : 'day'}.jpg`
}
