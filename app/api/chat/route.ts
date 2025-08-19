import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  try {
    // Get the last user message
    const lastMessage = messages[messages.length - 1]?.content || "";

    // Mock AI responses with tool calling simulation
    let response = "";
    let toolResult = null;

    // Check for weather requests
    if (lastMessage.toLowerCase().includes("weather")) {
      const location = extractLocation(lastMessage) || "New York";
      toolResult = {
        toolName: "getWeather",
        args: { location },
        result: {
          name: location,
          main: { temp: 22, feels_like: 25, humidity: 65 },
          weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
          wind: { speed: 3.5 },
          visibility: 10000,
        },
      };
      response = `Here's the current weather in ${location}:`;
    }
    // Check for F1 requests
    else if (
      lastMessage.toLowerCase().includes("f1") ||
      lastMessage.toLowerCase().includes("formula")
    ) {
      // Determine F1 query type
      let f1Type = "next-race";
      if (
        lastMessage.toLowerCase().includes("result") ||
        lastMessage.toLowerCase().includes("latest")
      ) {
        f1Type = "latest-race";
      } else if (lastMessage.toLowerCase().includes("standing")) {
        f1Type = "standings";
      }

      toolResult = {
        toolName: "getF1Results",
        args: { type: f1Type },
        result:
          f1Type === "latest-race"
            ? {
                MRData: {
                  RaceTable: {
                    Races: [
                      {
                        raceName: "Dutch Grand Prix",
                        round: "15",
                        date: "2024-08-25",
                        Circuit: {
                          circuitName: "Circuit Zandvoort",
                          Location: {
                            locality: "Zandvoort",
                            country: "Netherlands",
                          },
                        },
                        Results: [
                          {
                            position: "1",
                            Driver: {
                              givenName: "Max",
                              familyName: "Verstappen",
                            },
                            Constructor: { name: "Red Bull Racing" },
                            Time: { time: "1:30:45.123" },
                            points: "25",
                          },
                          {
                            position: "2",
                            Driver: {
                              givenName: "Lando",
                              familyName: "Norris",
                            },
                            Constructor: { name: "McLaren" },
                            Time: { time: "+22.896" },
                            points: "18",
                          },
                          {
                            position: "3",
                            Driver: {
                              givenName: "Charles",
                              familyName: "Leclerc",
                            },
                            Constructor: { name: "Ferrari" },
                            Time: { time: "+25.439" },
                            points: "15",
                          },
                        ],
                      },
                    ],
                  },
                },
              }
            : f1Type === "standings"
              ? {
                  MRData: {
                    StandingsTable: {
                      StandingsLists: [
                        {
                          season: "2024",
                          DriverStandings: [
                            {
                              position: "1",
                              Driver: {
                                givenName: "Max",
                                familyName: "Verstappen",
                              },
                              Constructors: [{ name: "Red Bull Racing" }],
                              points: "393",
                              wins: "9",
                            },
                            {
                              position: "2",
                              Driver: {
                                givenName: "Lando",
                                familyName: "Norris",
                              },
                              Constructors: [{ name: "McLaren" }],
                              points: "331",
                              wins: "3",
                            },
                            {
                              position: "3",
                              Driver: {
                                givenName: "Charles",
                                familyName: "Leclerc",
                              },
                              Constructors: [{ name: "Ferrari" }],
                              points: "307",
                              wins: "2",
                            },
                          ],
                        },
                      ],
                    },
                  },
                }
              : {
                  MRData: {
                    RaceTable: {
                      Races: [
                        {
                          raceName: "Singapore Grand Prix",
                          round: "18",
                          Circuit: {
                            circuitName: "Marina Bay Street Circuit",
                            Location: {
                              locality: "Singapore",
                              country: "Singapore",
                            },
                          },
                          date: "2024-09-22",
                          time: "12:00:00Z",
                        },
                      ],
                    },
                  },
                },
      };
      response =
        f1Type === "latest-race"
          ? `Here are the latest Formula 1 race results:`
          : f1Type === "standings"
            ? `Here are the current F1 driver standings:`
            : `Here's the next Formula 1 race information:`;
    }
    // Check for stock requests
    else if (
      lastMessage.toLowerCase().includes("stock") ||
      lastMessage.toLowerCase().includes("price")
    ) {
      const symbol = extractStockSymbol(lastMessage) || "AAPL";
      toolResult = {
        toolName: "getStockPrice",
        args: { symbol },
        result: {
          results: [
            {
              c: 150.25,
              h: 152.1,
              l: 149.8,
              o: 151.0,
              v: 45000000,
            },
          ],
        },
      };
      response = `Here's the stock information for ${symbol}:`;
    } else {
      // Handle greetings and general conversation
      const lowerMessage = lastMessage.toLowerCase();

      if (
        lowerMessage.includes("hi") ||
        lowerMessage.includes("hello") ||
        lowerMessage.includes("hey")
      ) {
        response = `Hello! I'm your AI assistant. I'm here to help you with various tasks. How can I assist you today?`;
      } else if (
        lowerMessage.includes("how are you") ||
        lowerMessage.includes("how do you do")
      ) {
        response = `I'm doing great, thank you for asking! I'm ready to help you with anything you need. What would you like to know about?`;
      } else if (lowerMessage.includes("good morning")) {
        response = `Good morning! I hope you're having a wonderful day. How can I help you today?`;
      } else if (lowerMessage.includes("good afternoon")) {
        response = `Good afternoon! How can I assist you today?`;
      } else if (lowerMessage.includes("good evening")) {
        response = `Good evening! What can I help you with tonight?`;
      } else if (
        lowerMessage.includes("thank") ||
        lowerMessage.includes("thanks")
      ) {
        response = `You're very welcome! I'm happy to help. Is there anything else you'd like to know?`;
      } else if (
        lowerMessage.includes("bye") ||
        lowerMessage.includes("goodbye") ||
        lowerMessage.includes("see you")
      ) {
        response = `Goodbye! Feel free to come back anytime you need assistance. Have a great day!`;
      } else if (
        lowerMessage.includes("help") ||
        lowerMessage.includes("what can you do")
      ) {
        response = `I can help you with:

🌤️ **Weather Information** - Ask "What's the weather in [city]?"
🏎️ **Formula 1 Updates** - Ask "Next F1 race" or "F1 standings"
📈 **Stock Prices** - Ask "[SYMBOL] stock price"

I can also have general conversations and answer questions. What would you like to explore?`;
      } else {
        // For unclear requests, provide a friendly response with some guidance
        response = `I'm not quite sure what you're looking for, but I'm here to help! You can ask me about weather, Formula 1, stock prices, or just chat with me about anything. What's on your mind?`;
      }
    }

    // Create streaming response with tool results
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // First send the text response
        const chunks = response.split(" ");
        let i = 0;

        const sendChunk = () => {
          if (i < chunks.length) {
            controller.enqueue(encoder.encode(chunks[i] + " "));
            i++;
            setTimeout(sendChunk, 30); // Faster typing speed
          } else {
            // After text, send tool result if available
            if (toolResult) {
              setTimeout(() => {
                controller.enqueue(
                  encoder.encode(
                    `\n\nTOOL_RESULT:${JSON.stringify(toolResult)}`,
                  ),
                );
                controller.close();
              }, 200);
            } else {
              controller.close();
            }
          }
        };

        sendChunk();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Sorry, I encountered an error. Please try again.", {
      headers: { "Content-Type": "text/plain" },
    });
  }
}

function extractLocation(message: string): string | null {
  const patterns = [
    /weather in ([^?]+)/i,
    /weather for ([^?]+)/i,
    /weather at ([^?]+)/i,
    /weather ([^?]+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

function extractStockSymbol(message: string): string | null {
  const patterns = [
    /([A-Z]{1,5}) stock/i,
    /([A-Z]{1,5}) price/i,
    /stock ([A-Z]{1,5})/i,
    /price ([A-Z]{1,5})/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return null;
}
