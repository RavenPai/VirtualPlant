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

export function plantBackgroundSrc({ weather, weatherKind, timeOfDay: tod } = {}) {
  const night = isNightScene(weather, tod)
  const sky = sceneWeather(weatherKind)
  return `/backgrounds/${sky}-${night ? 'night' : 'day'}.jpg`
}
