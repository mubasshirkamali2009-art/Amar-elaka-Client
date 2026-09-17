"use client";

import { useEffect, useState } from 'react';
import { DIVISIONS, DISTRICTS } from '@/lib/bangladeshRegions';

interface LeaderboardEntry {
    userId: string;
    name: string;
    totalAreaKm2: number;
    territoryCount: number;
}

const API_BASE = 'http://localhost:4001';
type Scope = 'all' | 'division' | 'district' | 'nearby';

const COLORS = ['#FF6B35', '#00D9FF', '#A855F7', '#FFC107', '#F43F5E'];
function colorForOwner(ownerId: string): string {
    let hash = 0;
    for (let i = 0; i < ownerId.length; i++) hash = ownerId.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Leaderboard() {
    const [scope, setScope] = useState<Scope>('all');
    const [selectedValue, setSelectedValue] = useState('');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [radiusKm, setRadiusKm] = useState(5);

    useEffect(() => {
        if (!('geolocation' in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            () => setUserLocation(null),
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }, []);

    useEffect(() => {
        async function fetchLeaderboard() {
            if ((scope === 'division' || scope === 'district') && !selectedValue) {
                setEntries([]); return;
            }
            if (scope === 'nearby' && !userLocation) {
                setEntries([]); return;
            }

            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ scope });
                if ((scope === 'division' || scope === 'district') && selectedValue) {
                    params.set('value', selectedValue);
                }
                if (scope === 'nearby' && userLocation) {
                    params.set('lat', String(userLocation[0]));
                    params.set('lng', String(userLocation[1]));
                    params.set('radius', String(radiusKm));
                }

                const res = await fetch(`${API_BASE}/api/leaderboard?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to load leaderboard');
                setEntries(await res.json());
            } catch (err) {
                console.error(err);
                setError('Could not load leaderboard data.');
                setEntries([]);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, [scope, selectedValue, userLocation, radiusKm]);

    return (
        <div className="w-full max-w-xl mx-auto p-4 sm:p-6 text-slate-200 font-sans">
            <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Leaderboard
                </h2>
                <p className="text-sm text-slate-400 mt-1">Ranked by total territory claimed.</p>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-4">
                {(['all', 'division', 'district', 'nearby'] as Scope[]).map((s) => (
                    <button
                        key={s}
                        onClick={() => { setScope(s); setSelectedValue(''); }}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${scope === s
                            ? 'bg-orange-500 text-slate-900 border-orange-500 font-bold'
                            : 'bg-transparent text-slate-400 border-slate-700'
                            }`}
                    >
                        {s === 'all' && 'All Bangladesh'}
                        {s === 'division' && 'By Division'}
                        {s === 'district' && 'By District'}
                        {s === 'nearby' && 'Around Me'}
                    </button>
                ))}
            </div>

            {scope === 'division' && (
                <select
                    className="w-full mb-4 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200"
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                >
                    <option value="">Select a division…</option>
                    {DIVISIONS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
            )}

            {scope === 'district' && (
                <select
                    className="w-full mb-4 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200"
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                >
                    <option value="">Select a district…</option>
                    {DISTRICTS.map(d => (
                        <option key={d.name} value={d.name}>{d.name} ({d.division})</option>
                    ))}
                </select>
            )}

            {scope === 'nearby' && (
                <div className="flex flex-wrap items-center gap-3 mb-4 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5">
                    <span className="text-sm whitespace-nowrap">Within {radiusKm} km</span>
                    <input
                        type="range" min={1} max={20} value={radiusKm}
                        onChange={(e) => setRadiusKm(Number(e.target.value))}
                        className="flex-1 min-w-[100px] accent-orange-500"
                    />
                    {!userLocation && <span className="text-xs text-amber-400">Waiting for your location…</span>}
                </div>
            )}

            {/* Ranked list */}
            <div className="flex flex-col gap-2">
                {loading && <div className="text-center text-sm text-slate-400 py-6">Loading…</div>}
                {!loading && error && <div className="text-center text-sm text-red-400 py-6">{error}</div>}
                {!loading && !error && entries.length === 0 && (
                    <div className="text-center text-sm text-slate-400 py-6">
                        No claimed territory found for this filter yet.
                    </div>
                )}
                {!loading && entries.map((entry, i) => (
                    <div
                        key={entry.userId}
                        className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3"
                    >
                        <span className="w-6 text-center font-bold text-slate-400 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            #{i + 1}
                        </span>
                        <span
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ background: colorForOwner(entry.userId) + '33', color: colorForOwner(entry.userId) }}
                        >
                            {entry.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base truncate">{entry.name}</div>
                            <div className="text-xs text-slate-400">
                                {entry.territoryCount} territor{entry.territoryCount === 1 ? 'y' : 'ies'}
                            </div>
                        </div>
                        <div className="font-bold text-sm sm:text-base text-cyan-400 whitespace-nowrap" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {entry.totalAreaKm2.toFixed(2)} km²
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}