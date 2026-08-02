import { useState, useEffect } from 'react';
import LocationPickerMap from '../../components/LocationPickerMap';
import { Tag, QrCode, Weight, Activity, Loader2, Building2 } from 'lucide-react';
import styles from '../../styles/BinNetwork.module.css';
import sharedStyles from '../../styles/Layout.module.css';

const DEFAULT_COORDINATES = [14.5995, 120.9842];

const createEmptyBinForm = () => ({
    name: '',
    address: '',
    qrCode: '',
    capacityKg: '500',
    status: 'Empty',
    description: '',
    assignedLgu: '',
    location: {
        type: 'Point',
        coordinates: [...DEFAULT_COORDINATES]
    }
});

const BinForm = ({ initialBin, onSubmit, onCancel, submitting, userGeolocation, lgus = [] }) => {
    const [binForm, setBinForm] = useState(() => {
        if (initialBin) {
            return {
                ...initialBin,
                assignedLgu: initialBin.assignedLgu?._id || initialBin.assignedLgu || ''
            };
        }
        return createEmptyBinForm();
    });
    const [errors, setErrors] = useState({});
    const isEditing = !!initialBin?._id;

    useEffect(() => {
        if (initialBin) {
            setBinForm({
                ...initialBin,
                assignedLgu: initialBin.assignedLgu?._id || initialBin.assignedLgu || ''
            });
        } else {
            setBinForm(createEmptyBinForm());
        }
    }, [initialBin]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBinForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!binForm.name.trim()) {
            newErrors.name = 'Bin name is required.';
        }
        const capacity = Number(binForm.capacityKg);
        if (!binForm.capacityKg || isNaN(capacity) || capacity <= 0) {
            newErrors.capacityKg = 'Capacity must be a positive number.';
        }
        if (!binForm.address || binForm.address === 'Fetching address...') {
            newErrors.location = 'Please click on the map to set the bin location.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const fetchAddressFromCoordinates = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (!response.ok) throw new Error('Failed to fetch address');
            const data = await response.json();
            return data.display_name || `Pinned at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            return `Pinned at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    };

    const handleLocationPick = async (coordinates) => {
        const nextLocation = {
            type: 'Point',
            coordinates
        };

        setBinForm((current) => ({
            ...current,
            location: nextLocation,
            address: 'Fetching address...'
        }));

        const address = await fetchAddressFromCoordinates(coordinates[0], coordinates[1]);
        setBinForm((current) => ({ ...current, address }));
        if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        const payload = {
            ...binForm,
            capacityKg: Number(binForm.capacityKg),
            currentFillKg: initialBin?.currentFillKg || 0,
            address: binForm.address || `Pinned at ${binForm.location.coordinates[0].toFixed(4)}, ${binForm.location.coordinates[1].toFixed(4)}`,
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className={sharedStyles.form} noValidate>
            <div className={sharedStyles.formRow}>
                <div className={sharedStyles.formGroup}>
                    <label>Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className={sharedStyles.inputWrapper}>
                        <Tag size={16} className={sharedStyles.inputIcon} />
                        <input
                            name="name"
                            className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.name ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`}
                            value={binForm.name}
                            onChange={handleChange}
                            placeholder="e.g. North Plaza Bin"
                        />
                    </div>
                    {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
                </div>
                <div className={sharedStyles.formGroup}>
                    <label>QR Code</label>
                    <div className={sharedStyles.inputWrapper}>
                        <QrCode size={16} className={sharedStyles.inputIcon} />
                        <input
                            name="qrCode"
                            className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`}
                            value={binForm.qrCode}
                            onChange={handleChange}
                            placeholder="e.g. BIN-NORTH-001"
                        />
                    </div>
                </div>
            </div>
            <div className={sharedStyles.formRow}>
                <div className={sharedStyles.formGroup}>
                    <label>Capacity (kg) <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className={sharedStyles.inputWrapper}>
                        <Weight size={16} className={sharedStyles.inputIcon} />
                        <input
                            name="capacityKg"
                            className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.capacityKg ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`}
                            type="number"
                            min="1"
                            value={binForm.capacityKg}
                            onChange={handleChange}
                        />
                    </div>
                    {errors.capacityKg && <span className={styles.fieldError}>{errors.capacityKg}</span>}
                </div>
                <div className={sharedStyles.formGroup}>
                    <label>Status</label>
                    <div className={sharedStyles.inputWrapper}>
                        <Activity size={16} className={sharedStyles.inputIcon} />
                        <select
                            name="status"
                            className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`}
                            value={binForm.status}
                            onChange={handleChange}
                            disabled={!isEditing}
                        >
                            <option value="Empty">Empty</option>
                            <option value="Full">Full</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>
                    {!isEditing && (
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' }}>
                            New bins are automatically set to 'Empty'.
                        </p>
                    )}
                </div>
            </div>

            <div className={sharedStyles.formRow}>
                <div className={sharedStyles.formGroup} style={{ width: '100%' }}>
                    <label>Assigned LGU</label>
                    <div className={sharedStyles.inputWrapper}>
                        <Building2 size={16} className={sharedStyles.inputIcon} />
                        <select
                            name="assignedLgu"
                            className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`}
                            value={binForm.assignedLgu || ''}
                            onChange={handleChange}
                        >
                            <option value="">-- No LGU Assigned --</option>
                            {lgus.map((lgu) => (
                                <option key={lgu._id} value={lgu._id}>
                                    {lgu.name} {lgu.jurisdiction ? `(${lgu.jurisdiction})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className={sharedStyles.formGroup}>
                <label>Location <span style={{ color: '#ef4444' }}>*</span></label>
                <div className={`${sharedStyles.mapPickerCard} ${errors.location ? sharedStyles.mapPickerError + ' ' + sharedStyles.shake : ''}`}>
                    <div className={styles.mapPickerHeader}>
                        <span>
                            <strong>Click to pin</strong>
                            {binForm.address && binForm.address !== 'Fetching address...'
                                ? <span className={styles.mapAddress}>&nbsp;— {binForm.address}</span>
                                : binForm.address === 'Fetching address...'
                                ? <span className={styles.mapAddress}>&nbsp;— Resolving address...</span>
                                : null
                            }
                        </span>
                        <span>Move the marker to adjust</span>
                    </div>
                    <div className={styles.mapPickerMap}>
                        <LocationPickerMap position={binForm.location.coordinates} onSelect={handleLocationPick} />
                    </div>
                </div>
                {errors.location && <span className={styles.fieldError}>{errors.location}</span>}
            </div>

            <div className={sharedStyles.modalFooter}>
                <button type="button" onClick={onCancel} className={sharedStyles.cancelBtn}>Cancel</button>
                <button type="submit" className={sharedStyles.submitBtn} disabled={submitting}>
                    {submitting ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    {submitting ? 'Saving...' : (initialBin ? 'Save Changes' : 'Create Bin')}
                </button>
            </div>
        </form>
    );
};

export default BinForm;
