import Leaderboard from "@/components/Leaderboard";
import TerritoryMap from "@/components/Territorymap";

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#0B132B] text-slate-200 p-8">
      <div>
        <Leaderboard />
        <TerritoryMap />
      </div>
    </main>
  );
}