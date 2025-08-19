import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertTriangle } from "lucide-react"

interface StockCardProps {
  data: {
    symbol?: string
    price?: string
    change?: string
    changePercent?: string
    volume?: string
    high?: string
    low?: string
    open?: string
    previousClose?: string
    interval?: string
  }
}

export function StockCard({ data }: StockCardProps) {
  const {
    symbol = "N/A",
    price = "0.00",
    change = "0.00",
    changePercent = "0.00%",
    volume = "N/A",
    high = "N/A",
    low = "N/A",
    open = "N/A",
    previousClose = "N/A",
    interval = "1D",
  } = data || {}

  if (!data || !data.symbol) {
    return (
      <Card className="w-full max-w-md border-destructive/50">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Stock data unavailable</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isPositive = change.startsWith("+") || (!change.startsWith("-") && Number.parseFloat(change) > 0)
  const changeColor = isPositive ? "text-green-600" : "text-red-600"
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="font-bold text-lg">{symbol}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {interval}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{price}</p>
            <div className={`flex items-center gap-1 ${changeColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">{change}</span>
              <span className="font-medium">({changePercent})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open</span>
              <span className="font-medium">{open}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High</span>
              <span className="font-medium">{high}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Low</span>
              <span className="font-medium">{low}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prev Close</span>
              <span className="font-medium">{previousClose}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume</span>
              <span className="font-medium">{volume}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <BarChart3 className="h-3 w-3" />
              <span className="text-xs">Market Data</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
