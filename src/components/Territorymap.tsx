"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Territory {
    _id: string;
    ownerId: string;
    ownerName: string;
    area: {
        type: 'Polygon';
        coordinates: [number, number][][];
    };
    areaKm2: number;
    claimedAt: string;
}

const COLORS = ['#FF6B35', '#00D9FF', '#A855F7', '#FFC107', '#F43F5E'];

function colorForOwner(ownerId: string): string {
    let hash = 0;
    for (let i = 0; i < ownerId.length; i++) {
        hash = ownerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

function toLeafletCoords(rings: [number, number][][]): [number, number][][] {
    return rings.map(ring => ring.map(([lng, lat]) => [lat, lng]));
}

const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];
const API_BASE = 'http://localhost:4001';

export default function TerritoryMap() {
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTerritories() {
            try {
                const res = await fetch(`${API_BASE}/api/territories`);
                if (!res.ok) {
                    throw new Error('Failed to reach the server');
                }
                const data: Territory[] = await res.json();
                setTerritories(data);
            } catch (err) {
                console.error(err);
                setError('Could not load territory data. Showing an empty map.');
                setTerritories([]);
            } finally {
                setLoading(false);
            }
        }

        fetchTerritories();
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MapContainer
                center={DHAKA_CENTER}
                zoom={13}
                style={{ height: '100%', width: '100%', background: '#16213a' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

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
                            <strong>{t.ownerName}</strong>
                            <br />
                            {t.areaKm2.toFixed(2)} km²
                        </Tooltip>
                    </Polygon>
                ))}
            </MapContainer>

            {loading && <div style={overlayStyle}>Loading territories…</div>}

            {!loading && territories.length === 0 && !error && (
                <div style={overlayStyle}>No territory claimed yet — be the first to run one in.</div>
            )}

            {error && <div style={{ ...overlayStyle, color: '#F43F5E' }}>{error}</div>}
        </div>
    );
}

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 14,
    left: 14,
    background: 'rgba(15,23,42,0.8)',
    color: '#E2E8F0',
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 13,
    zIndex: 1000,
    pointerEvents: 'none',
};