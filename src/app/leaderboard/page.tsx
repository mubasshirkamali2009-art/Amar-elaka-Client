"use client";

import dynamic from "next/dynamic";
import Leaderboard from "@/components/Leaderboard";

const TerritoryMap = dynamic(() => import("@/components/Territorymap"), {
  ssr: false,
  loading: () => <p className="text-slate-400 p-4">Loading map...</p>,
});

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