"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from 'react-leaflet';
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

const COLORS = ['#FF6B35', '#00D9FF', '#A855F7', '#FFC107', '#F43F5E'];
const API_BASE = process.env.NEXT_PUBLIC_BASE_URL;
const DHAKA_FALLBACK: [number, number] = [23.8103, 90.4125];
const DEFAULT_RADIUS_KM = 5;

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

function FitToRadius({ center, radiusKm }: { center: [number, number]; radiusKm: number }) {
    const map = useMap();
    useEffect(() => {
        const bounds = L.latLng(center).toBounds(radiusKm * 2 * 1000);
        map.fitBounds(bounds);
    }, [center, radiusKm, map]);
    return null;
}

type BrowseMode = 'nearby' | 'division' | 'district';

export default function TerritoryMap() {
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationStatus, setLocationStatus] = useState<'locating' | 'found' | 'denied' | 'unsupported'>('locating');
    const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
    const [browseMode, setBrowseMode] = useState<BrowseMode>('nearby');
    const [selectedRegion, setSelectedRegion] = useState('');

    useEffect(() => {
        async function fetchTerritories() {
            try {
                const res = await fetch(`${API_BASE}/api/territories`);
                if (!res.ok) throw new Error('Failed to reach the server');
                const data: Territory[] = await res.json();
                setTerritories(data);
            } catch (err) {
                console.error(err);
                setError('Could not load territory data.');
                setTerritories([]);
            } finally {
                setLoading(false);
            }
        }
        fetchTerritories();
    }, []);

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

    // Where the map is centered: either the browsed division/district,
    // or the user's real/fallback location when in "nearby" mode.
    const mapCenter: [number, number] = useMemo(() => {
        if (browseMode === 'division' && selectedRegion) {
            const found = DIVISIONS.find(d => d.name === selectedRegion);
            if (found) return found.center;
        }
        if (browseMode === 'district' && selectedRegion) {
            const found = DISTRICTS.find(d => d.name === selectedRegion);
            if (found) return found.center;
        }
        return userLocation ?? DHAKA_FALLBACK;
    }, [browseMode, selectedRegion, userLocation]);

    const nearby = useMemo(() => {
        return territories
            .map(t => ({ ...t, distance: distanceKm(mapCenter, centroidOf(t)) }))
            .filter(t => t.distance <= radiusKm)
            .sort((a, b) => b.areaKm2 - a.areaKm2);
    }, [territories, mapCenter, radiusKm]);

    return (
        <div className="w-full max-w-xl mx-auto p-4 font-sans">
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-700 bg-slate-800" style={{ zIndex: 1 }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    <FitToRadius center={mapCenter} radiusKm={radiusKm} />

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
                </MapContainer>

                <div className="absolute top-3 left-3 right-3 z-[50] bg-slate-900/75 backdrop-blur border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200">
                    {browseMode === 'nearby' && locationStatus === 'locating' && 'Finding your location…'}
                    {browseMode === 'nearby' && locationStatus === 'found' && 'Centered on your location'}
                    {browseMode === 'nearby' && locationStatus === 'denied' && 'Location access denied — showing Dhaka'}
                    {browseMode === 'nearby' && locationStatus === 'unsupported' && 'Location not supported — showing Dhaka'}
                    {browseMode === 'division' && (selectedRegion ? `Browsing ${selectedRegion} Division` : 'Select a division below')}
                    {browseMode === 'district' && (selectedRegion ? `Browsing ${selectedRegion} District` : 'Select a district below')}
                </div>

                {!loading && nearby.length === 0 && !error && (
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

            {/* Browse mode selector */}
            <div className="flex flex-wrap gap-2 mt-3.5">
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

            {browseMode === 'division' && (
                <select
                    className="w-full mt-3 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                >
                    <option value="">Select a division…</option>
                    {DIVISIONS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
            )}
            {browseMode === 'district' && (
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