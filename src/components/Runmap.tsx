"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DIVISIONS, DISTRICTS } from '@/lib/bangladeshRegions';

interface Territory {
    _id: string;
    ownerId: string;
    ownerName: string;
    area: { type: 'Polygon'; coordinates: [number, number][][] };
    areaKm2: number;
    district: string | null;
    division: string | null;
    claimedAt: string;
}

interface CurrentUser {
    id: string;
    name: string;
    avatarUrl?: string;
}

interface RunMapProps {
    // Pass the logged-in user in — their name/photo is what appears on the
    // live marker, and their id is who the claimed/stolen elaka belongs to.
    currentUser?: CurrentUser;
}

interface StolenFromEntry {
    ownerId: string;
    areaKm2: number;
}

interface RunResult {
    loopClosed: boolean;
    message?: string;
    territory: (Territory & { stolenFrom?: StolenFromEntry[] }) | null;
}

const COLORS = ['#FF6B35', '#00D9FF', '#A855F7', '#FFC107', '#F43F5E'];
const API_BASE = 'http://localhost:4001';
const DHAKA_FALLBACK: [number, number] = [23.8103, 90.4125];
const DEFAULT_RADIUS_KM = 5;

// GPS fixes worse than this (meters) are ignored so the live trail stays accurate
const MAX_ACCEPTABLE_ACCURACY_M = 40;

function colorForOwner(ownerId: string): string {
    let hash = 0;
    for (let i = 0; i < ownerId.length; i++) hash = ownerId.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

function toLeafletCoords(rings: [number, number][][]): [number, number][][] {
    return rings.map(ring => ring.map(([lng, lat]) => [lat, lng]));
}

function distanceKm(a: [number, number], b: [number, number]): number {
    const R = 6371;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLng = (b[1] - a[1]) * Math.PI / 180;
    const lat1 = a[0] * Math.PI / 180;
    const lat2 = b[0] * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function centroidOf(t: Territory): [number, number] {
    const ring = t.area.coordinates[0];
    const lat = ring.reduce((s, [, lat]) => s + lat, 0) / ring.length;
    const lng = ring.reduce((s, [lng]) => s + lng, 0) / ring.length;
    return [lat, lng];
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
}

function formatElapsed(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function formatPace(meters: number, seconds: number): string {
    if (meters < 20 || seconds < 5) return '--:--';
    const km = meters / 1000;
    const paceSecPerKm = seconds / km;
    const m = Math.floor(paceSecPerKm / 60).toString().padStart(2, '0');
    const s = Math.floor(paceSecPerKm % 60).toString().padStart(2, '0');
    return `${m}:${s} /km`;
}

function FitToRadius({ center, radiusKm, disabled }: { center: [number, number]; radiusKm: number; disabled?: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (disabled) return;
        const bounds = L.latLng(center).toBounds(radiusKm * 2 * 1000);
        map.fitBounds(bounds);
    }, [center, radiusKm, map, disabled]);
    return null;
}

// Keeps the map gently following the runner's live position without
// fighting a user who is trying to pan/zoom manually.
function FollowLive({ position, active }: { position: [number, number] | null; active: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (active && position) {
            map.panTo(position, { animate: true, duration: 0.4 });
        }
    }, [position, active, map]);
    return null;
}

function buildAvatarIcon(user?: CurrentUser): L.DivIcon {
    const initial = (user?.name || '?').trim().charAt(0).toUpperCase() || '?';
    const inner = user?.avatarUrl
        ? `<img src="${user.avatarUrl}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
        : `<div style="width:100%;height:100%;border-radius:50%;background:#FF6B35;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#0f172a;">${initial}</div>`;

    return L.divIcon({
        className: 'elaka-live-avatar',
        html: `
            <div style="position:relative;width:44px;height:44px;">
                <div class="elaka-pulse-ring"></div>
                <div style="position:relative;width:44px;height:44px;border-radius:50%;border:3px solid #FF6B35;overflow:hidden;box-shadow:0 0 0 3px rgba(15,23,42,0.9);">
                    ${inner}
                </div>
            </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
    });
}

type BrowseMode = 'nearby' | 'division' | 'district';

export default function RunMap({ currentUser }: RunMapProps) {
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationStatus, setLocationStatus] = useState<'locating' | 'found' | 'denied' | 'unsupported'>('locating');
    const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
    const [browseMode, setBrowseMode] = useState<BrowseMode>('nearby');
    const [selectedRegion, setSelectedRegion] = useState('');

    // ---- Live run state ----
    const [isRunning, setIsRunning] = useState(false);
    const [runId, setRunId] = useState<string | null>(null);
    const [livePosition, setLivePosition] = useState<[number, number] | null>(null);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]); // lat,lng for drawing
    const [distanceMeters, setDistanceMeters] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [runError, setRunError] = useState<string | null>(null);
    const [runResult, setRunResult] = useState<RunResult | null>(null);
    const [isStopping, setIsStopping] = useState(false);

    const watchIdRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchTerritories = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/territories`);
            if (!res.ok) throw new Error('Failed to reach the server');
            const data: Territory[] = await res.json();
            setTerritories(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Could not load territory data.');
            setTerritories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTerritories();
    }, [fetchTerritories]);

    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setLocationStatus('unsupported');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
                setLocationStatus('found');
            },
            (err) => {
                console.warn('Location permission denied or failed:', err.message);
                setLocationStatus('denied');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    }, []);

    // Clean up the GPS watch + timer if the component unmounts mid-run
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
            if (timerRef.current !== null) clearInterval(timerRef.current);
        };
    }, []);

    const mapCenter: [number, number] = useMemo(() => {
        if (isRunning && livePosition) return livePosition;
        if (browseMode === 'division' && selectedRegion) {
            const found = DIVISIONS.find(d => d.name === selectedRegion);
            if (found) return found.center;
        }
        if (browseMode === 'district' && selectedRegion) {
            const found = DISTRICTS.find(d => d.name === selectedRegion);
            if (found) return found.center;
        }
        return userLocation ?? DHAKA_FALLBACK;
    }, [isRunning, livePosition, browseMode, selectedRegion, userLocation]);

    const nearby = useMemo(() => {
        return territories
            .map(t => ({ ...t, distance: distanceKm(mapCenter, centroidOf(t)) }))
            .filter(t => t.distance <= radiusKm)
            .sort((a, b) => b.areaKm2 - a.areaKm2);
    }, [territories, mapCenter, radiusKm]);

    const avatarIcon = useMemo(() => buildAvatarIcon(currentUser), [currentUser]);

    // -------------------------------------------------------------
    // Called on every GPS fix while a run is active
    // -------------------------------------------------------------
    const handlePosition = useCallback(async (position: GeolocationPosition, activeRunId: string) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Drop unreliable fixes so the trail stays meter-accurate
        if (accuracy && accuracy > MAX_ACCEPTABLE_ACCURACY_M) return;

        setLivePosition([latitude, longitude]);
        setRouteCoords(prev => [...prev, [latitude, longitude]]);

        try {
            const res = await fetch(`${API_BASE}/api/runs/${activeRunId}/points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (typeof data.distanceMeters === 'number') {
                setDistanceMeters(data.distanceMeters);
            }
        } catch (err) {
            console.error('Failed to save GPS point:', err);
        }
    }, []);

    const startRun = useCallback(async () => {
        setRunError(null);
        setRunResult(null);

        if (!currentUser) {
            setRunError('Log in first — a run has to belong to someone.');
            return;
        }
        if (!('geolocation' in navigator)) {
            setRunError('Your browser/device does not support location tracking.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/runs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id }),
            });
            if (!res.ok) throw new Error('Failed to start run');
            const run = await res.json();
            const newRunId: string = run._id;

            setRunId(newRunId);
            setRouteCoords([]);
            setDistanceMeters(0);
            setElapsedSeconds(0);
            setIsRunning(true);

            timerRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);

            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => handlePosition(position, newRunId),
                (err) => {
                    console.warn('Live location error:', err.message);
                    setRunError('Lost location access — your run trail may have gaps.');
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
            );
        } catch (err) {
            console.error(err);
            setRunError('Could not start the run. Try again.');
        }
    }, [currentUser, handlePosition]);

    const stopRun = useCallback(async () => {
        if (!runId) return;
        setIsStopping(true);

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        try {
            const res = await fetch(`${API_BASE}/api/runs/${runId}/stop`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to stop run');

            setRunResult({
                loopClosed: !!data.loopClosed,
                message: data.message,
                territory: data.territory ?? null,
            });

            // Elaka may have just changed hands — refresh the map/leaderboard data
            await fetchTerritories();
        } catch (err) {
            console.error(err);
            setRunError('Could not save the finished run.');
        } finally {
            setIsRunning(false);
            setRunId(null);
            setIsStopping(false);
        }
    }, [runId, fetchTerritories]);

    return (
        <div className="w-full max-w-xl mx-auto p-4 font-sans">
            <style>{`
                .elaka-pulse-ring {
                    position: absolute;
                    inset: -8px;
                    border-radius: 9999px;
                    background: rgba(255, 107, 53, 0.35);
                    animation: elakaPulse 1.8s ease-out infinite;
                }
                @keyframes elakaPulse {
                    0% { transform: scale(0.7); opacity: 0.8; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
            `}</style>

            {/* Live run stat bar */}
            {isRunning && (
                <div className="mb-3.5 grid grid-cols-3 gap-2 bg-slate-800 border border-orange-500/40 rounded-2xl px-3.5 py-3">
                    <div className="text-center">
                        <div className="text-xs text-slate-400">Distance</div>
                        <div className="text-lg font-bold text-orange-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {formatDistance(distanceMeters)}
                        </div>
                    </div>
                    <div className="text-center border-x border-slate-700">
                        <div className="text-xs text-slate-400">Time</div>
                        <div className="text-lg font-bold text-slate-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {formatElapsed(elapsedSeconds)}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-400">Pace</div>
                        <div className="text-lg font-bold text-cyan-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {formatPace(distanceMeters, elapsedSeconds)}
                        </div>
                    </div>
                </div>
            )}

            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-700 bg-slate-800" style={{ zIndex: 1 }}>
                <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    <FitToRadius center={mapCenter} radiusKm={radiusKm} disabled={isRunning} />
                    <FollowLive position={livePosition} active={isRunning} />

                    {territories.map((t) => (
                        <Polygon
                            key={t._id}
                            positions={toLeafletCoords(t.area.coordinates)}
                            pathOptions={{
                                color: colorForOwner(t.ownerId),
                                fillColor: colorForOwner(t.ownerId),
                                fillOpacity: 0.3,
                                weight: 2,
                            }}
                        >
                            <Tooltip sticky>
                                <strong>{t.ownerName}</strong><br />
                                {t.areaKm2.toFixed(2)} km²
                                {t.district && <><br />{t.district}, {t.division}</>}
                            </Tooltip>
                        </Polygon>
                    ))}

                    {/* The live trail being drawn as the runner moves */}
                    {routeCoords.length > 1 && (
                        <Polyline
                            positions={routeCoords}
                            pathOptions={{ color: '#FF6B35', weight: 4, opacity: 0.9, dashArray: '1 8', lineCap: 'round' }}
                        />
                    )}

                    {/* Her live position, shown with her profile photo */}
                    {isRunning && livePosition && (
                        <Marker position={livePosition} icon={avatarIcon}>
                            <Tooltip direction="top" offset={[0, -20]}>
                                {currentUser?.name || 'You'} — running now
                            </Tooltip>
                        </Marker>
                    )}
                </MapContainer>

                <div className="absolute top-3 left-3 right-3 z-[50] bg-slate-900/75 backdrop-blur border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200">
                    {isRunning && 'Tracking your run live — keep going and loop back to your start point to claim the elaka'}
                    {!isRunning && browseMode === 'nearby' && locationStatus === 'locating' && 'Finding your location…'}
                    {!isRunning && browseMode === 'nearby' && locationStatus === 'found' && 'Centered on your location'}
                    {!isRunning && browseMode === 'nearby' && locationStatus === 'denied' && 'Location access denied — showing Dhaka'}
                    {!isRunning && browseMode === 'nearby' && locationStatus === 'unsupported' && 'Location not supported — showing Dhaka'}
                    {!isRunning && browseMode === 'division' && (selectedRegion ? `Browsing ${selectedRegion} Division` : 'Select a division below')}
                    {!isRunning && browseMode === 'district' && (selectedRegion ? `Browsing ${selectedRegion} District` : 'Select a district below')}
                </div>

                {!isRunning && !loading && nearby.length === 0 && !error && (
                    <div className="absolute bottom-3 left-3 right-3 z-[50] bg-slate-900/85 text-slate-200 text-sm text-center rounded-xl px-3.5 py-2.5">
                        No territory claimed yet in this area — be the first to run one in.
                    </div>
                )}
                {error && (
                    <div className="absolute bottom-3 left-3 right-3 z-[50] bg-slate-900/85 text-red-400 text-sm text-center rounded-xl px-3.5 py-2.5">
                        {error}
                    </div>
                )}
            </div>

            {/* Start / Stop control */}
            <div className="mt-3.5">
                {!isRunning ? (
                    <button
                        onClick={startRun}
                        disabled={!currentUser}
                        className="w-full py-3.5 rounded-2xl text-base font-bold bg-orange-500 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Start Running
                    </button>
                ) : (
                    <button
                        onClick={stopRun}
                        disabled={isStopping}
                        className="w-full py-3.5 rounded-2xl text-base font-bold bg-red-500 text-slate-900 disabled:opacity-60 transition-colors"
                    >
                        {isStopping ? 'Saving…' : 'Stop Running'}
                    </button>
                )}
                {runError && <div className="text-xs text-red-400 mt-2 text-center">{runError}</div>}
            </div>

            {/* Result of the last run */}
            {runResult && (
                <div className={`mt-3.5 rounded-2xl px-4 py-3 border ${runResult.loopClosed
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-amber-500/10 border-amber-500/40'
                    }`}>
                    {runResult.loopClosed && runResult.territory ? (
                        <>
                            <div className="text-sm font-bold text-emerald-400">
                                Elaka claimed! {runResult.territory.areaKm2.toFixed(2)} km²
                            </div>
                            <div className="text-xs text-slate-300 mt-1">
                                {runResult.territory.district}, {runResult.territory.division}
                            </div>
                            {runResult.territory.stolenFrom && runResult.territory.stolenFrom.length > 0 && (
                                <div className="text-xs text-slate-400 mt-1">
                                    Stolen from {runResult.territory.stolenFrom.length} runner
                                    {runResult.territory.stolenFrom.length > 1 ? 's' : ''} — it's under your name on the map now.
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-sm text-amber-300">
                            {runResult.message || 'Loop not closed — get back near your start point next time to claim the elaka.'}
                        </div>
                    )}
                </div>
            )}

            {/* Browse mode selector (disabled while a run is live) */}
            <div className={`flex flex-wrap gap-2 mt-3.5 ${isRunning ? 'opacity-40 pointer-events-none' : ''}`}>
                {(['nearby', 'division', 'district'] as BrowseMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => { setBrowseMode(m); setSelectedRegion(''); }}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${browseMode === m
                            ? 'bg-orange-500 text-slate-900 border-orange-500 font-bold'
                            : 'bg-transparent text-slate-400 border-slate-700'
                            }`}
                    >
                        {m === 'nearby' && 'Around Me'}
                        {m === 'division' && 'By Division'}
                        {m === 'district' && 'By District'}
                    </button>
                ))}
            </div>

            {browseMode === 'division' && !isRunning && (
                <select
                    className="w-full mt-3 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                >
                    <option value="">Select a division…</option>
                    {DIVISIONS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
            )}
            {browseMode === 'district' && !isRunning && (
                <select
                    className="w-full mt-3 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                >
                    <option value="">Select a district…</option>
                    {DISTRICTS.map(d => <option key={d.name} value={d.name}>{d.name} ({d.division})</option>)}
                </select>
            )}

            <div className="flex items-center gap-3 mt-3.5 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 flex-wrap">
                <span className="text-sm whitespace-nowrap">Showing within {radiusKm} km</span>
                <input
                    type="range" min={1} max={20} value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="flex-1 min-w-[120px] accent-orange-500"
                />
            </div>

            <div className="mt-3.5 bg-slate-800 border border-slate-700 rounded-2xl p-3.5">
                <div className="text-sm font-bold mb-2.5">
                    Nearby leaderboard ({nearby.length} within {radiusKm} km)
                </div>
                {nearby.length === 0 && (
                    <div className="text-xs text-slate-400">No claimed territory within this radius yet.</div>
                )}
                {nearby.map((t, i) => (
                    <div key={t._id} className="flex items-center gap-2 py-2 border-t border-slate-700 text-sm flex-wrap">
                        <span className="text-slate-400 w-6 text-xs">#{i + 1}</span>
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: colorForOwner(t.ownerId) }} />
                        <span className="flex-1 font-semibold min-w-[80px]">{t.ownerName}</span>
                        <span className="text-slate-400 text-xs">{t.distance.toFixed(1)} km away</span>
                        <span className="text-cyan-400 font-bold text-sm">{t.areaKm2.toFixed(2)} km²</span>
                    </div>
                ))}
            </div>
        </div>
    );
}