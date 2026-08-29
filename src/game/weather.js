export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,cloud_cover,weather_code,is_day,precipitation`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather unavailable')
  const data = await res.json()
  const c = data.current
  return {
    tempC: c.temperature_2m,
    cloudCover: c.cloud_cover,
    code: c.weather_code,
    isDay: c.is_day === 1,
    precipitation: c.precipitation,
    fetchedAt: Date.now(),
  }
}

export function weatherLabel(code, tempC) {
  if (tempC >= 30) return 'Hot'
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Rain'
  if ([95, 96, 99].includes(code)) return 'Storm'
  if ([45, 48].includes(code)) return 'Fog'
  if ([1, 2, 3].includes(code)) return 'Clouds'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  return 'Clear'
}

export async function detectLocation() {
  if (!navigator.geolocation) return { lat: 16.84, lon: 96.17 }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 16.84, lon: 96.17 }),
      { timeout: 6000 },
    )
  })
}
