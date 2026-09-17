"use client";

import dynamic from "next/dynamic";

const RunMap = dynamic(() => import("@/components/Runmap"), {
  ssr: false,
  loading: () => <p className="text-slate-400 p-4">Loading map...</p>,
});

export default function RunPage() {
  return (
    <div>
      <main className="min-h-screen bg-[#0B132B] text-slate-200 p-8">
        <RunMap />
      </main>
    </div>
  );
}

