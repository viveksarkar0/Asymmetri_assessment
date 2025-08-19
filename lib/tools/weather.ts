export async function getWeather(location: string) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      return {
        location,
        temperature: '22°C',
        condition: 'Sunny',
        humidity: '65%',
        windSpeed: '10 km/h',
        description: 'Demo weather data - API key not configured'
      }
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
    )
    
    if (!response.ok) throw new Error('Weather API error')
    
    const data = await response.json()
    
    return {
      location: data.name,
      temperature: `${Math.round(data.main.temp)}°C`,
      condition: data.weather[0].main,
      humidity: `${data.main.humidity}%`,
      windSpeed: `${Math.round(data.wind.speed * 3.6)} km/h`,
      description: data.weather[0].description
    }
  } catch (error) {
    return {
      location,
      temperature: '22°C',
      condition: 'Sunny',
      humidity: '65%',
      windSpeed: '10 km/h',
      description: 'Demo weather data - API unavailable'
    }
  }
}
