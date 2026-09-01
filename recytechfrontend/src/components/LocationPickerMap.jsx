import { useEffect, useState, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER = [14.5995, 120.9842];

export const toLeafletCoords = (coords) => {
    if (!Array.isArray(coords) || coords.length !== 2) return DEFAULT_CENTER;
    const [c0, c1] = coords.map(Number);
    if (isNaN(c0) || isNaN(c1)) return DEFAULT_CENTER;
    // If c0 is longitude (> 90 or < -90) and c1 is latitude (<= 90), swap for Leaflet [lat, lng]
    if (Math.abs(c0) > 90 && Math.abs(c1) <= 90) {
        return [c1, c0];
    }
    return [c0, c1];
};

const MapClickHandler = ({ onSelect, setMarkerPosition }) => {
    useMapEvents({
        click: (event) => {
            const nextPosition = [event.latlng.lat, event.latlng.lng];
            setMarkerPosition(nextPosition);
            onSelect(nextPosition);
        }
    });
    return null;
};

const MapSetup = ({ center, zoom }) => {
    const map = useMap();
    const initial = useRef(true);

    useEffect(() => {
        // Immediate invalidate
        map.invalidateSize();

        // Staggered invalidations to wait for modal enter transitions and DOM reflow
        const timeouts = [
            setTimeout(() => map.invalidateSize(), 50),
            setTimeout(() => map.invalidateSize(), 150),
            setTimeout(() => map.invalidateSize(), 300),
            setTimeout(() => map.invalidateSize(), 600)
        ];

        // Setup ResizeObserver on the map container
        const container = map.getContainer();
        let observer = null;
        if (typeof ResizeObserver !== 'undefined' && container) {
            observer = new ResizeObserver(() => {
                map.invalidateSize();
            });
            observer.observe(container);
        }

        return () => {
            timeouts.forEach(clearTimeout);
            if (observer && container) {
                observer.unobserve(container);
            }
        };
    }, [map]);

    useEffect(() => {
        if (initial.current) {
            initial.current = false;
            map.invalidateSize();
            map.setView(center, zoom);
            return;
        }
        map.invalidateSize();
        map.flyTo(center, zoom, { duration: 0.8 });
    }, [center, zoom, map]);

    return null;
};

const LocationPickerMap = ({ position, onSelect }) => {
    const leafletCoords = toLeafletCoords(position);
    const [markerPosition, setMarkerPosition] = useState(leafletCoords);

    useEffect(() => {
        setMarkerPosition(toLeafletCoords(position));
    }, [position]);

    return (
        <MapContainer
            center={leafletCoords}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapSetup center={leafletCoords} zoom={15} />
            <MapClickHandler onSelect={onSelect} setMarkerPosition={setMarkerPosition} />
            <Marker position={markerPosition}>
                <Popup>Click to place the bin pin</Popup>
            </Marker>
        </MapContainer>
    );
};

export default LocationPickerMap;
