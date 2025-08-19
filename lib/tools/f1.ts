export async function getF1Matches(type: 'next-race' | 'last-race' | 'standings') {
    try {
      let url = ''
      switch (type) {
        case 'next-race':
          url = 'https://ergast.com/api/f1/current/next.json'
          break
        case 'last-race':
          url = 'https://ergast.com/api/f1/current/last/results.json'
          break
        case 'standings':
          url = 'https://ergast.com/api/f1/current/driverStandings.json'
          break
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('F1 API error')
      
      const data = await response.json()
      
      if (type === 'next-race') {
        const race = data.MRData.RaceTable.Races[0]
        return {
          type: 'next-race',
          raceName: race.raceName,
          circuit: race.Circuit.circuitName,
          location: `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
          date: race.date,
          time: race.time
        }
      } else if (type === 'last-race') {
        const race = data.MRData.RaceTable.Races[0]
        const results = race.Results.slice(0, 3)
        return {
          type: 'last-race',
          raceName: race.raceName,
          circuit: race.Circuit.circuitName,
          date: race.date,
          results: results.map((r: any) => ({
            position: r.position,
            driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
            constructor: r.Constructor.name,
            time: r.Time?.time || 'N/A'
          }))
        }
      } else {
        const standings = data.MRData.StandingsTable.StandingsLists[0].DriverStandings.slice(0, 5)
        return {
          type: 'standings',
          season: data.MRData.StandingsTable.StandingsLists[0].season,
          standings: standings.map((s: any) => ({
            position: s.position,
            driver: `${s.Driver.givenName} ${s.Driver.familyName}`,
            constructor: s.Constructors[0].name,
            points: s.points
          }))
        }
      }
    } catch (error) {
      return {
        type,
        error: 'F1 API unavailable',
        demoData: type === 'next-race' ? {
          raceName: 'Monaco Grand Prix',
          circuit: 'Circuit de Monaco',
          location: 'Monte Carlo, Monaco',
          date: '2024-05-26',
          time: '13:00:00Z'
        } : {
          raceName: 'Last Race Demo',
          results: [
            { position: '1', driver: 'Max Verstappen', constructor: 'Red Bull Racing', time: '1:32:07.986' },
            { position: '2', driver: 'Lewis Hamilton', constructor: 'Mercedes', time: '+5.432' },
            { position: '3', driver: 'Charles Leclerc', constructor: 'Ferrari', time: '+12.891' }
          ]
        }
      }
    }
}
