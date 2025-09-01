import { useEffect, useState } from "react";
import { getOdds, calculateParlay } from "../api/odds";

export default function ParlayBuilder() {
  const [odds, setOdds] = useState([]);
  const [selected, setSelected] = useState([]);
  const [wager, setWager] = useState(100);
  const [result, setResult] = useState(null);
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

  const toggleOdd = (price) => {
    if (selected.includes(price)) {
      setSelected(selected.filter((s) => s !== price));
    } else if (selected.length < 5) {
      setSelected([...selected, price]);
    }
  };

  const handleCalculate = async () => {
    try {
      const res = await calculateParlay({ odds: selected, wager });
      if (res.error) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
        setError(null);
      }
    } catch (err) {
      setError("Parlay calculation failed.");
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-2">🎲 Build Your Parlay</h2>

      {error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : odds.length === 0 ? (
        <p className="text-gray-500 text-sm">No odds available to build parlays.</p>
      ) : (
        <>
          <p className="text-sm mb-2">Select up to 5 odds from live games:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {odds.slice(0, 10).map((o, i) => {
              const price = o?.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price;
              const name = o?.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.name;
              if (!price) return null;
              const isSelected = selected.includes(price);
              return (
                <button
                  key={i}
                  className={`px-3 py-1 rounded-lg border ${
                    isSelected ? "bg-green-300" : "bg-gray-200"
                  }`}
                  onClick={() => toggleOdd(price)}
                >
                  {name} ({price})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              value={wager}
              onChange={(e) => setWager(Number(e.target.value))}
              className="border p-1 rounded w-20"
            />
            <span>USD Wager</span>
          </div>

          <button
            onClick={handleCalculate}
            disabled={selected.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
          >
            Calculate Parlay
          </button>

          {result && (
            <div className="mt-4 text-sm">
              <p>📊 Odds: {result.odds}</p>
              <p>🎯 Probability: {(result.probability * 100).toFixed(2)}%</p>
              <p>💰 Payout: ${result.payout}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

