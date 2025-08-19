import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null

export interface ToolCall {
  toolName: string
  args: Record<string, any>
}

export interface AIResponse {
  content: string
  toolCalls: ToolCall[]
}

export class GeminiService {
  private model = genAI?.getGenerativeModel({ model: "gemini-1.5-flash" })

  async generateResponse(messages: any[]): Promise<AIResponse> {
    try {
      // If no API key is configured, return a helpful message
      if (!genAI || !this.model) {
        return {
          content: "Hi! I'm your AI assistant. To enable full functionality, please add your GOOGLE_API_KEY to the .env.local file. For now, I can help with basic responses!",
          toolCalls: [],
        }
      }

      const prompt = this.buildPrompt(messages)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the response to extract tool calls
      const { content, toolCalls } = this.parseResponse(text)

      return {
        content,
        toolCalls,
      }
    } catch (error) {
      console.error("Gemini API error:", error)
      return {
        content: "I'm having trouble processing your request right now. Please check your GOOGLE_API_KEY in .env.local and try again.",
        toolCalls: [],
      }
    }
  }

  private buildPrompt(messages: any[]): string {
    const systemPrompt = `You are a helpful AI assistant. Respond naturally and conversationally to user questions.

For specific queries, you can use these tools:
- Weather: Use getWeather with city and country
- Formula 1: Use getF1Matches with type (latest-race, standings, schedule)  
- Stocks: Use getStockPrice with symbol

When using tools, provide a complete response first, then add the tool call on a single line in this exact format:

TOOL_CALL: {"toolName": "tool_name", "args": {"param": "value"}}

Examples:
- Weather: TOOL_CALL: {"toolName": "getWeather", "args": {"city": "London", "country": "UK"}}
- F1: TOOL_CALL: {"toolName": "getF1Matches", "args": {"type": "latest-race"}}
- Stock: TOOL_CALL: {"toolName": "getStockPrice", "args": {"symbol": "AAPL"}}

IMPORTANT: Keep the tool call JSON on a single line and ensure it's complete.`

    const conversation = messages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")

    return `${systemPrompt}\n\nConversation:\n${conversation}\n\nAssistant:`
  }

  private parseResponse(text: string): { content: string; toolCalls: ToolCall[] } {
    // Look for tool call pattern on a single line
    const toolCallMatch = text.match(/TOOL_CALL:\s*(\{.*?\})/i)
    
    if (toolCallMatch) {
      try {
        let toolCallJson = toolCallMatch[1].trim()
        
        // Basic cleanup
        toolCallJson = toolCallJson
          .replace(/,\s*}/g, '}')     // Remove trailing commas
          .replace(/,\s*]/g, ']')     // Remove trailing commas
          .trim()
        
        // If JSON is incomplete (missing closing brace), try to fix it
        if (!toolCallJson.endsWith('}')) {
          const openBraces = (toolCallJson.match(/\{/g) || []).length
          const closeBraces = (toolCallJson.match(/\}/g) || []).length
          if (openBraces > closeBraces) {
            toolCallJson += '}'.repeat(openBraces - closeBraces)
          }
        }
        
        let toolCall
        try {
          toolCall = JSON.parse(toolCallJson)
        } catch (parseError) {
          // If JSON parsing fails, extract manually from the raw text
          const rawJson = toolCallMatch[1]
          console.log("Attempting manual extraction from:", rawJson)
          
          // Extract toolName
          const toolNameMatch = rawJson.match(/"toolName":\s*"([^"]+)"/i)
          if (!toolNameMatch) throw parseError
          
          const toolName = toolNameMatch[1]
          const args: Record<string, any> = {}
          
          // Extract args based on tool type
          if (toolName === 'getWeather') {
            const cityMatch = rawJson.match(/"city":\s*"([^"]+)"/i)
            const countryMatch = rawJson.match(/"country":\s*"([^"]+)"/i)
            if (cityMatch) args.city = cityMatch[1]
            if (countryMatch) args.country = countryMatch[1]
          } else if (toolName === 'getStockPrice') {
            const symbolMatch = rawJson.match(/"symbol":\s*"([^"]+)"/i)
            if (symbolMatch) args.symbol = symbolMatch[1]
          } else if (toolName === 'getF1Matches') {
            const typeMatch = rawJson.match(/"type":\s*"([^"]+)"/i)
            if (typeMatch) args.type = typeMatch[1]
          }
          
          toolCall = { toolName, args }
        }
        
        // Remove the tool call from the content
        const content = text.replace(/TOOL_CALL:\s*\{.*?\}/i, "").trim()
        
        return {
          content: content || "Let me get that information for you.",
          toolCalls: [toolCall],
        }
      } catch (error) {
        console.error("Failed to parse tool call:", error)
        console.error("Raw tool call JSON:", toolCallMatch[1])
        // Return the content without tool calls if parsing fails
        const content = text.replace(/TOOL_CALL:.*$/i, "").trim()
        return {
          content: content || text,
          toolCalls: [],
        }
      }
    }

    return {
      content: text,
      toolCalls: [],
    }
  }
}

export const geminiService = new GeminiService()
