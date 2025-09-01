import { useEffect, useState } from "react";
import { getRecommendedParlay } from "../api/odds";

export default function RecommendedParlay() {
  const [parlay, setParlay] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParlay = async () => {
      try {
        const data = await getRecommendedParlay();
        if (data.error) {
          setError(data.error);
          setParlay(null);
        } else {
          setParlay(data.recommended_parlay);
          setError(null);
        }
      } catch (err) {
        setError("Failed to load recommended parlay.");
      }
    };

    fetchParlay();
    const interval = setInterval(fetchParlay, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-2">⭐ Recommended Parlay</h2>
      {error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : !parlay ? (
        <p className="text-gray-500 text-sm">No recommended parlay yet.</p>
      ) : (
        <div>
          {parlay.legs.map((leg, i) => (
            <div key={i} className="border-b py-1">
              <p>
                {leg.name} @ {leg.price}
              </p>
            </div>
          ))}
          <p className="mt-2 text-sm">🎯 Target Odds: {parlay.target_odds}</p>
        </div>
      )}
    </div>
  );
}

