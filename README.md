# AI-Powered Chat Assistant

A sophisticated AI chat assistant built with Next.js that intelligently calls real-world tools to fetch live information about weather, Formula 1 racing, and stock market data.

## 🚀 Features

- **AI-Powered Conversations**: Powered by Google Gemini AI for intelligent responses
- **Smart Tool Calling**: Automatically detects when to use tools based on user queries
- **Real-time Data**: Live information from OpenWeatherMap, Ergast F1 API, and Alpha Vantage
- **OAuth Authentication**: Secure login with Google and GitHub
- **Persistent Chat History**: All conversations saved to PostgreSQL database
- **Modern UI**: Beautiful interface built with shadcn/ui components
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript and React 19
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with OAuth providers
- **UI Components**: shadcn/ui with Tailwind CSS
- **AI Integration**: Google Gemini AI API
- **External APIs**: OpenWeatherMap, Ergast F1, Alpha Vantage
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (local or cloud)
- Google OAuth credentials
- GitHub OAuth credentials
- Google Gemini API key
- OpenWeatherMap API key (optional)
- Alpha Vantage API key (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-assistant
pnpm install
```

### 2. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp env.template .env.local
```

Update `.env.local` with your actual values:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_assistant"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# AI Provider
GOOGLE_API_KEY="your-gemini-api-key"

# External APIs (optional - will use demo data if not provided)
OPENWEATHER_API_KEY="your-openweather-api-key"
ALPHA_VANTAGE_API_KEY="your-alphavantage-api-key"
```

### 3. Database Setup

Create your PostgreSQL database and run the migration:

```bash
# Create database
createdb ai_assistant

# Run migration
pnpm db:push
```

### 4. OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Homepage URL: `http://localhost:3000`
4. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 5. AI API Setup

#### Google Gemini
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env.local`

### 6. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Chat
- `POST /api/chat` - Send message and get AI response with tool calls

### Chats Management
- `GET /api/chats` - List user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/[chatId]` - Get chat details and messages
- `DELETE /api/chats/[chatId]` - Delete chat
- `POST /api/chats/[chatId]/messages` - Save message

## 🛠️ Available Tools

### 1. Weather Tool (`getWeather`)
- **Purpose**: Get current weather information for any location
- **Parameters**: `city` (required), `country` (optional)
- **Data Source**: OpenWeatherMap API
- **Example Query**: "What's the weather like in Tokyo?"

### 2. F1 Racing Tool (`getF1Matches`)
- **Purpose**: Get Formula 1 race information, results, and standings
- **Parameters**: `type` (latest-race, standings, schedule), `season` (optional)
- **Data Source**: Ergast F1 API
- **Example Query**: "Show me the latest F1 race results"

### 3. Stock Market Tool (`getStockPrice`)
- **Purpose**: Get real-time stock market data and prices
- **Parameters**: `symbol` (e.g., AAPL, GOOGL), `interval` (daily, 1min, 5min)
- **Data Source**: Alpha Vantage API
- **Example Query**: "What's the current price of Apple stock?"

## 🎯 How It Works

1. **User Input**: User types a question about weather, F1, or stocks
2. **AI Processing**: Gemini AI analyzes the query and determines if tools are needed
3. **Tool Execution**: If tools are required, they're automatically called with appropriate parameters
4. **Data Fetching**: External APIs provide real-time information
5. **Response Generation**: AI combines tool results with natural language response
6. **Storage**: Conversation is saved to database for future reference

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
GOOGLE_API_KEY="your-gemini-api-key"
OPENWEATHER_API_KEY="your-openweather-key"
ALPHA_VANTAGE_API_KEY="your-alphavantage-key"
```

## 🧪 Testing

Test the AI assistant with these example queries:

- "What's the weather like in London?"
- "Show me the latest F1 standings"
- "What's the current price of Tesla stock?"
- "Tell me about the weather in New York and show me F1 results"

## 🔒 Security Features

- OAuth 2.0 authentication with NextAuth.js
- Protected API routes requiring authentication
- User data isolation (users can only access their own chats)
- Environment variable protection
- CORS protection
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**: Check OAuth credentials and redirect URIs
2. **Database Connection**: Verify DATABASE_URL and database accessibility
3. **API Rate Limits**: Some external APIs have rate limits
4. **Environment Variables**: Ensure all required variables are set

### Debug Mode

Enable debug logging by setting:

```env
DEBUG="next-auth:*"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Drizzle ORM](https://orm.drizzle.team/) for database management
- [NextAuth.js](https://next-auth.js.org/) for authentication

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Review the code and configuration
3. Open an issue on GitHub
4. Contact the development team

---

**Built with ❤️ using modern web technologies**