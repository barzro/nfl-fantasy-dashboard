import LiveGames from "./components/LiveGames.jsx";
import FantasyScores from "./components/FantasyScores.jsx";
import BestBets from "./components/BestBets.jsx";
import ParlayBuilder from "./components/ParlayBuilder.jsx";
import RecommendedParlay from "./components/RecommendedParlay.jsx";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        🏈 NFL Fantasy Betting Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LiveGames />
        <FantasyScores leagueId="1236604285207183360" />
        <BestBets />
        <ParlayBuilder />
        <RecommendedParlay />
      </div>
    </div>
  );
}

export default App;   // ✅ <-- this is what was missing

