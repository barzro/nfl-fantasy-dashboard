import { useEffect, useState } from "react";
import { getOdds } from "../api/odds";

export default function BestBets() {
  const [odds, setOdds] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOdds = async () => {
      try {
        const data = await getOdds();
        if (data.error) {
          setError(data.error);
          setOdds([]);
        } else {
          setOdds(data || []);
          setError(null);
        }
      } catch (err) {
        setError("Failed to load odds.");
      }
    };

    fetchOdds();
    const interval = setInterval(fetchOdds, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-2">💰 Best Bets</h2>
      {error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : odds.length === 0 ? (
        <p className="text-gray-500 text-sm">No odds available.</p>
      ) : (
        odds.slice(0, 5).map((o, i) => (
          <div key={i} className="border-b py-2">
            <p>{o.home_team} vs {o.away_team}</p>
          </div>
        ))
      )}
    </div>
  );
}

