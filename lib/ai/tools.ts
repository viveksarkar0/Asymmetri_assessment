import { getWeatherData } from "@/lib/api/weather"
import { getF1Data } from "@/lib/api/f1"
import { getStockData } from "@/lib/api/stocks"

export interface Tool {
  name: string
  description: string
  parameters: Record<string, any>
  execute: (args: any) => Promise<any>
}

export const tools: Record<string, Tool> = {
  getWeather: {
    name: "getWeather",
    description: "Get weather information for a specific location",
    parameters: {
      city: { type: "string", description: "City name" },
      country: { type: "string", description: "Country code (optional)" },
    },
    execute: async (args: { city: string; country?: string }) => {
      return await getWeatherData(args.city, args.country)
    },
  },
  getF1Matches: {
    name: "getF1Matches",
    description: "Get Formula 1 race information and results",
    parameters: {
      type: { 
        type: "string", 
        description: "Type of F1 data: latest-race, standings, or schedule",
        enum: ["latest-race", "standings", "schedule"]
      },
      season: { type: "string", description: "Season year (optional)" },
    },
    execute: async (args: { type: string; season?: string }) => {
      return await getF1Data(args.type as any, args.season)
    },
  },
  getStockPrice: {
    name: "getStockPrice",
    description: "Get stock market information for a specific symbol",
    parameters: {
      symbol: { type: "string", description: "Stock symbol (e.g., AAPL, GOOGL)" },
      interval: { type: "string", description: "Data interval (daily, 1min, 5min, etc.)" },
    },
    execute: async (args: { symbol: string; interval?: string }) => {
      return await getStockData(args.symbol, args.interval || "daily")
    },
  },
}

export async function executeTool(toolName: string, args: any): Promise<any> {
  const tool = tools[toolName]
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`)
  }

  try {
    const result = await tool.execute(args)
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export function getToolSchema() {
  return Object.values(tools).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }))
}
