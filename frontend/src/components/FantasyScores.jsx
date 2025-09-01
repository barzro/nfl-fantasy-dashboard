import { useEffect, useState } from "react";
import { getFantasyScores } from "../api/fantasy";

export default function FantasyScores({ leagueId }) {
  const [fantasy, setFantasy] = useState([]);
  const [week, setWeek] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFantasy = async () => {
      try {
        const data = await getFantasyScores(leagueId);
        if (data.error) {
          setError(data.error);
          setFantasy([]);
        } else {
          setWeek(data.week);
          setFantasy(data.matchups || []);
          setError(null);
        }
      } catch (err) {
        setError("Failed to fetch fantasy scores.");
      }
    };

    fetchFantasy();
    const interval = setInterval(fetchFantasy, 30000);
    return () => clearInterval(interval);
  }, [leagueId]);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-2">📊 Fantasy Matchups</h2>
      {week && <p className="text-sm text-gray-500 mb-2">Week {week}</p>}

      {error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : fantasy.length === 0 ? (
        <p className="text-gray-500 text-sm">No fantasy data available.</p>
      ) : (
        fantasy.map((m) => {
          const myTeam =
            m.team1.owner_name === "barzil4810" || m.team2.owner_name === "barzil4810";
          return (
            <div
              key={m.matchup_id}
              className={`border-b py-2 ${myTeam ? "bg-yellow-100 font-bold" : ""}`}
            >
              <p>
                {m.team1.team_name} ({m.team1.owner_name}, {m.team1.record}) —{" "}
                {m.team1.points} pts
              </p>
              <p className="text-center">vs</p>
              <p>
                {m.team2.team_name} ({m.team2.owner_name}, {m.team2.record}) —{" "}
                {m.team2.points} pts
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}

