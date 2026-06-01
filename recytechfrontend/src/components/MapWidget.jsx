import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue in React-Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapWidget = ({ address }) => {
    const [coordinates, setCoordinates] = useState([14.5995, 120.9842]); // Defaults to Manila
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!address) {
            setLoading(false);
            return;
        }

        // Fetch coordinates using OpenStreetMap Nominatim API (Free Geocoding)
        const fetchCoordinates = async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Geocoding error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchCoordinates();
    }, [address]);

    if (loading) return <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>Loading map...</div>;
    if (error) return <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#991b1b', fontSize: '14px' }}>Map preview unavailable for this address.</div>;

    return (
        <div style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <MapContainer center={coordinates} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coordinates}>
                    <Popup>{address}</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapWidget;