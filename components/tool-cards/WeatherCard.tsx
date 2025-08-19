import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, Wind, Thermometer, AlertTriangle } from "lucide-react"

interface WeatherCardProps {
  data: {
    city?: string
    country?: string
    temperature?: string
    condition?: string
    humidity?: string
    windSpeed?: string
    description?: string
  }
}

export function WeatherCard({ data }: WeatherCardProps) {
  const {
    city = "Unknown",
    country = "Unknown",
    temperature = "N/A",
    condition = "unknown",
    humidity = "N/A",
    windSpeed = "N/A",
    description = "No description available",
  } = data || {}

  if (!data || (!data.city && !data.temperature)) {
    return (
      <Card className="w-full max-w-sm border-destructive/50">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Weather data unavailable</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return "☀️"
      case "clouds":
        return "☁️"
      case "rain":
        return "🌧️"
      case "snow":
        return "❄️"
      case "thunderstorm":
        return "⛈️"
      default:
        return "🌤️"
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">{getWeatherIcon(condition)}</span>
          {city}, {country}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">Temperature</span>
          </div>
          <span className="text-2xl font-bold">{temperature}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-muted-foreground">Humidity</p>
              <p className="font-medium">{humidity}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-muted-foreground">Wind</p>
              <p className="font-medium">{windSpeed}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground capitalize">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
