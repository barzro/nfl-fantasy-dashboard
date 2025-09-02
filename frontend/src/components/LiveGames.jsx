import { useEffect, useState } from "react";
import api from "../api/client";

export default function LiveGames() {
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        console.log("Fetching from:", api.defaults.baseURL + "/api/games/live"); // ✅ Debug log
        const res = await api.get("/api/games/live");
        console.log("API response:", res.data); // ✅ Debug log
        setGames(res.data);
      } catch (err) {
        console.error("Error fetching games:", err); // ✅ Debug log
        setError("Failed to load live games.");
      }
    };
    fetchGames();
  }, []);

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">Live NFL Games</h2>
      {games.length === 0 ? (
        <p>No live games right now.</p>
      ) : (
        <ul>
          {games.map((game, idx) => (
            <li key={idx}>
              {game.HomeTeam} vs {game.AwayTeam} — {game.Status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

