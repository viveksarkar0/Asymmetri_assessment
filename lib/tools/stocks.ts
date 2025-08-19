export async function getStockPrice(symbol: string) {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY
      if (!apiKey) {
        return {
          symbol: symbol.toUpperCase(),
          price: '$150.25',
          change: '+2.34',
          changePercent: '+1.58%',
          volume: '45,234,567',
          marketCap: '$2.4T',
          description: 'Demo stock data - API key not configured'
        }
      }

      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
      )
      
      if (!response.ok) throw new Error('Stock API error')
      
      const data = await response.json()
      const quote = data['Global Quote']
      
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error('Invalid symbol or API limit reached')
      }
      
      return {
        symbol: quote['01. symbol'],
        price: `$${parseFloat(quote['05. price']).toFixed(2)}`,
        change: parseFloat(quote['09. change']).toFixed(2),
        changePercent: quote['10. change percent'],
        volume: parseInt(quote['06. volume']).toLocaleString(),
        high: `$${parseFloat(quote['03. high']).toFixed(2)}`,
        low: `$${parseFloat(quote['04. low']).toFixed(2)}`,
      }
    } catch (error) {
      return {
        symbol: symbol.toUpperCase(),
        price: '$150.25',
        change: '+2.34',
        changePercent: '+1.58%',
        volume: '45,234,567',
        high: '$152.80',
        low: '$148.90',
        description: 'Demo stock data - API unavailable'
      }
    }
}
