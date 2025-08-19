import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, MapPin } from "lucide-react"

interface F1CardProps {
  data: any
  type: "latest-race" | "standings" | "schedule"
}

export function F1Card({ data, type }: F1CardProps) {
  if (type === "latest-race") {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {data.raceName} - Results
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Round {data.round} • {data.date}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.results?.slice(0, 5).map((result: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={index < 3 ? "default" : "secondary"}
                    className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                  >
                    {result.position}
                  </Badge>
                  <div>
                    <p className="font-medium">{result.driver}</p>
                    <p className="text-sm text-muted-foreground">{result.constructor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{result.time}</p>
                  <p className="text-sm text-muted-foreground">{result.points} pts</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === "standings") {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {data.season} Driver Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.drivers?.slice(0, 10).map((driver: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={index < 3 ? "default" : "secondary"}
                    className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                  >
                    {driver.position}
                  </Badge>
                  <div>
                    <p className="font-medium">{driver.driver}</p>
                    <p className="text-sm text-muted-foreground">{driver.constructor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{driver.points} pts</p>
                  <p className="text-sm text-muted-foreground">{driver.wins} wins</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === "schedule") {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            {data.season} F1 Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.races?.slice(0, 8).map((race: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    R{race.round}
                  </Badge>
                  <div>
                    <p className="font-medium">{race.raceName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {race.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{race.date}</p>
                  {race.time && <p className="text-sm text-muted-foreground">{race.time}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
