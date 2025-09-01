import { useEffect, useState } from "react";
import { getLiveGames } from "../api/nfl";

export default function LiveGames() {
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await getLiveGames();
        if (data.error) {
          setError(data.error);
          setGames([]);
        } else {
          setGames(data.games || []);
          setError(null);
        }
      } catch (err) {
        setError("Failed to load live games.");
      }
    };

    fetchGames();
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-2">🏈 Live Games + Odds</h2>
      {error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : games.length === 0 ? (
        <p className="text-gray-500 text-sm">No live games available.</p>
      ) : (
        games.map((g, i) => (
          <div key={i} className="border-b py-2">
            <p>
              {g.HomeTeam} vs {g.AwayTeam} — {g.Status}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

