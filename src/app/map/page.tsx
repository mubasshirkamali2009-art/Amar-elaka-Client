"use client";

import dynamic from "next/dynamic";

const TerritoryMap = dynamic(() => import("@/components/Territorymap"), {
  ssr: false,
  loading: () => <p style={{ color: "#E2E8F0", padding: "20px" }}>Loading map...</p>,
});

export default function MapPage() {
  return (
    <div>
      <TerritoryMap />
    </div>
  );
}