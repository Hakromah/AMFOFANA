"use client"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icon issues in Next.js
const customIcon = new L.Icon({
    iconUrl: '/logo/fofana.png', // Corrected path based on file listing
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
});

export default function Map() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>;
    }

    // Coordinates for Fish Market, Monrovia (Approx)
    const position: [number, number] = [6.2933, -10.7959];

    return (
        <MapContainer center={position} zoom={15} scrollWheelZoom={false} className="h-full w-full rounded-3xl">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={customIcon}>
                <Popup>
                    <div className="text-center">
                        <h3 className="font-bold text-[#2857AE]">A.M. Fofana High School</h3>
                        <p>Fish Market, Monrovia</p>
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
