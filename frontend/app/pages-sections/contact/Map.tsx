"use client"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
// Fix for default marker icon issues in Next.js
const customIcon = L.divIcon({
    className: 'custom-map-marker',
    html: `   <a href="https://maps.google.com/?q=6.2933,-10.7959" target="_blank" class="text group/marker h-full w-full block duration-500 justify-center">
        <img src="/logo/fofana.png" class="w-10 h-10 object-contain mx-auto mb-2"/>
        <div class="relative flex h-full items-center justify-center">
            <div class="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 80 80" fill="none" class="animate-pulse">
                <circle class="circle second-circle fill-[#960048] opacity-20" cx="40" cy="40" r="40" />
                <circle class="circle third-circle fill-[#960048] opacity-40" cx="40.0006" cy="39.9999" r="26.6667" />
                <circle class="circle fill-[#960048]" cx="39.9993" cy="40.0001" r="13.3333" />
                </svg>
            </div>
            <span style="box-shadow: 0 13.016px 16.767px -4.594px rgba(13, 25, 46, 0.14);" class="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-xs font-bold px-3 py-2 rounded-lg text-nowrap text-black opacity-0 group-hover/marker:opacity-100 transition-opacity duration-300 pointer-events-none">
            Get Directions
            </span>
        </div>
    </a>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
});

export default function Map() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Coordinates for Fish Market, Monrovia (Approx)
    const position: [number, number] = [6.2933, -10.7959];

    if (!isMounted) {
        return <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>;
    }

    return (
        <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={false}
            className="h-full w-full rounded-3xl"
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={customIcon}>
                <Popup>
                    <div className="text-center">
                        <h3 className="font-bold text-[#2857AE]">A.M. Fofana High School</h3>
                        <p>Fish Market, Monrovia</p>
                        <a href="https://maps.google.com/?q=6.2933,-10.7959" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 block">
                            Get Directions
                        </a>
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
