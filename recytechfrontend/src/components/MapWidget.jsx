import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

const DEFAULT_CENTER = [14.5995, 120.9842];

const MapFocusController = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center && center.length === 2) {
            map.flyTo(center, zoom, { duration: 1.1 });
        }
    }, [center, zoom, map]);

    return null;
};

const MapWidget = ({ bins = [], selectedBinId, onSelectBin, userGeolocation }) => {
    // Filter for bins that have valid coordinates from the API
    const locations = bins.filter(bin =>
        bin.location?.coordinates &&
        Array.isArray(bin.location.coordinates) &&
        bin.location.coordinates.length === 2
    );

    if (locations.length === 0) {
        return (
            <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#6b7280', fontSize: '14px' }}>
                No bins with valid locations to display on the map.
            </div>
        );
    }

    const selectedBin = locations.find(bin => bin._id === selectedBinId);
    const center = selectedBin?.location?.coordinates || locations[0]?.location?.coordinates || userGeolocation || DEFAULT_CENTER;
    const zoom = selectedBin ? 15 : 13;

    // Custom icon for the selected marker
    const selectedIcon = L.divIcon({
        html: '<div style="width: 14px; height: 14px; border-radius: 999px; background: #2563eb; border: 2px solid white; box-shadow: 0 0 0 4px rgba(37,99,235,0.2);"></div>',
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    return (
        <div style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapFocusController center={center} zoom={zoom} />
                {locations.map((bin) => {
                    const isSelected = Boolean(selectedBinId && bin._id === selectedBinId);

                    return (
                        <Marker
                            key={bin._id}
                            position={bin.location.coordinates}
                            icon={isSelected ? selectedIcon : DefaultIcon}
                            eventHandlers={{ click: () => onSelectBin?.(bin._id) }}
                        >
                            <Popup>
                                <div style={{ minWidth: '180px' }}>
                                    <strong>{bin.name}</strong><br />
                                    {bin.address}<br />
                                    <small>Status: {bin.status}</small>
                                    <div style={{ marginTop: '8px', color: '#2563eb', fontSize: '12px' }}>
                                        {isSelected ? 'Selected bin' : 'Click to focus this bin'}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapWidget;