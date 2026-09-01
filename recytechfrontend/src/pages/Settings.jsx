import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Settings.module.css';
import { 
    User, 
    Lock, 
    Bell, 
    Shield, 
    Save, 
    Eye, 
    EyeOff, 
    Check, 
    X, 
    Mail, 
    ShieldCheck, 
    KeyRound, 
    Loader2,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

const Settings = () => {
    const toastContext = useToast();
    const notify = toastContext.showToast || toastContext.addToast || console.log;
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Saved User State (for display before form submit)
    const [savedUser, setSavedUser] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: ''
    });

    // Editable form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: ''
    });
    const [profileErrors, setProfileErrors] = useState({});

    // Password state
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Preferences state
    const [preferences, setPreferences] = useState({
        liveAlerts: true,
        soundAlerts: true,
        autoCenterMap: true,
        defaultTimeframe: 'month',
        defaultPageSize: 10
    });

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const initialProfile = {
            firstName: userInfo.firstName || '',
            lastName: userInfo.lastName || '',
            email: userInfo.email || '',
            role: userInfo.role || 'Admin'
        };
        setSavedUser(initialProfile);
        setFormData(initialProfile);

        const savedPrefs = localStorage.getItem('recytech_preferences');
        if (savedPrefs) {
            try {
                setPreferences({
                    liveAlerts: true,
                    soundAlerts: true,
                    autoCenterMap: true,
                    defaultTimeframe: 'month',
                    defaultPageSize: 10,
                    ...JSON.parse(savedPrefs)
                });
            } catch (e) {
                console.error('Failed to parse preferences', e);
            }
        }
    }, []);

    // Real-time Password Validation
    const pwd = passwordData.newPassword;
    const pwdReqs = {
        length: pwd.length >= 8,
        uppercase: /[A-Z]/.test(pwd),
        lowercase: /[a-z]/.test(pwd),
        number: /\d/.test(pwd),
        special: /[^A-Za-z0-9]/.test(pwd)
    };

    const validCount = Object.values(pwdReqs).filter(Boolean).length;
    const strengthScore = Math.round((validCount / 5) * 100);
    const strengthLabel = validCount <= 2 ? 'Weak' : validCount <= 4 ? 'Moderate' : 'Strong';
    const strengthColor = validCount <= 2 ? '#ef4444' : validCount <= 4 ? '#f59e0b' : '#10b981';

    // Handle Name Input Change (Sanitize digits & clear errors)
    const handleNameChange = (field, value) => {
        const cleanedValue = value.replace(/\d/g, ''); // Instantly strip out digits
        setFormData(prev => ({ ...prev, [field]: cleanedValue }));
        if (profileErrors[field]) {
            setProfileErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Profile Form Validation
    const validateProfile = () => {
        const errors = {};
        const nameRegex = /^[a-zA-Z\u00C0-\u024F\s.'-]+$/;

        const trimmedFirst = formData.firstName.trim();
        if (!trimmedFirst) {
            errors.firstName = 'First name is required.';
        } else if (trimmedFirst.length < 2) {
            errors.firstName = 'First name must be at least 2 characters.';
        } else if (trimmedFirst.length > 50) {
            errors.firstName = 'First name cannot exceed 50 characters.';
        } else if (!nameRegex.test(trimmedFirst)) {
            errors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes.';
        }

        const trimmedLast = formData.lastName.trim();
        if (!trimmedLast) {
            errors.lastName = 'Last name is required.';
        } else if (trimmedLast.length < 2) {
            errors.lastName = 'Last name must be at least 2 characters.';
        } else if (trimmedLast.length > 50) {
            errors.lastName = 'Last name cannot exceed 50 characters.';
        } else if (!nameRegex.test(trimmedLast)) {
            errors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes.';
        }

        setProfileErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle Profile Save
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateProfile()) {
            notify('Please correct the highlighted errors before saving.', 'error');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.put('/users/profile', {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim()
            });

            // Update local storage and savedUser state ONLY after successful backend response
            const current = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const updated = { ...current, firstName: data.firstName, lastName: data.lastName };
            localStorage.setItem('userInfo', JSON.stringify(updated));

            setSavedUser(prev => ({
                ...prev,
                firstName: data.firstName,
                lastName: data.lastName
            }));

            setProfileErrors({});
            notify('Profile information updated successfully!', 'success');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update profile';
            notify(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle Password Change
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!passwordData.newPassword) {
            notify('Please enter a new password.', 'error');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            notify('New password and confirmation do not match.', 'error');
            return;
        }

        if (validCount < 5) {
            notify('Please meet all password requirements before saving.', 'error');
            return;
        }

        setSavingPassword(true);
        try {
            await api.put('/users/profile', {
                password: passwordData.newPassword
            });

            setPasswordData({ newPassword: '', confirmPassword: '' });
            notify('Password changed successfully!', 'success');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update password';
            notify(msg, 'error');
        } finally {
            setSavingPassword(false);
        }
    };

    // Handle Preference Toggle
    const handlePreferenceToggle = (key) => {
        const updated = { ...preferences, [key]: !preferences[key] };
        setPreferences(updated);
        localStorage.setItem('recytech_preferences', JSON.stringify(updated));
        notify('Preferences updated successfully.', 'info');
    };

    const initials = `${(savedUser.firstName || 'U').charAt(0)}${(savedUser.lastName || '').charAt(0)}`.toUpperCase();

    return (
        <div className={styles.container}>
            <Sidebar activePage="Settings" />

            <main className={styles.main}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Account Settings</h1>
                    <p className={styles.subTitle}>Manage your account identity, security credentials, and system preferences.</p>
                </div>

                <div className={styles.settingsLayout}>
                    {/* Left Vertical Nav Tabs */}
                    <div className={styles.navCard}>
                        <button
                            type="button"
                            className={activeTab === 'profile' ? styles.navItemActive : styles.navItem}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={18} />
                            <span>Profile Details</span>
                        </button>
                        <button
                            type="button"
                            className={activeTab === 'security' ? styles.navItemActive : styles.navItem}
                            onClick={() => setActiveTab('security')}
                        >
                            <Lock size={18} />
                            <span>Security & Password</span>
                        </button>
                        <button
                            type="button"
                            className={activeTab === 'preferences' ? styles.navItemActive : styles.navItem}
                            onClick={() => setActiveTab('preferences')}
                        >
                            <Bell size={18} />
                            <span>Preferences</span>
                        </button>
                    </div>

                    {/* Right Main Content Area */}
                    <div>
                        {activeTab === 'profile' && (
                            <div className={styles.contentCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconCircle} style={{ background: '#ecfdf5', color: '#10b981' }}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h2 className={styles.cardTitle}>Personal Profile</h2>
                                        <p className={styles.cardSubtext}>Update your identity and display information.</p>
                                    </div>
                                </div>

                                {/* Banner */}
                                <div className={styles.profileHeaderCard}>
                                    <div className={styles.avatarLarge}>
                                        {initials}
                                    </div>
                                    <div>
                                        <p className={styles.profileMetaName}>{`${savedUser.firstName} ${savedUser.lastName}`.trim() || 'User Profile'}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={styles.profileMetaBadge}>
                                                <ShieldCheck size={12} /> {savedUser.role}
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#047857' }}>{savedUser.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileSubmit} noValidate>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="settingsFirstName" className={styles.label}>
                                                First Name <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <div className={styles.inputWrapper}>
                                                <User size={16} className={styles.inputIcon} />
                                                <input
                                                    id="settingsFirstName"
                                                    type="text"
                                                    placeholder="e.g., Juan"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleNameChange('firstName', e.target.value)}
                                                    className={`${styles.input} ${profileErrors.firstName ? styles.inputError : ''}`}
                                                />
                                            </div>
                                            {profileErrors.firstName && (
                                                <span className={styles.error}>{profileErrors.firstName}</span>
                                            )}
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="settingsLastName" className={styles.label}>
                                                Last Name <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <div className={styles.inputWrapper}>
                                                <User size={16} className={styles.inputIcon} />
                                                <input
                                                    id="settingsLastName"
                                                    type="text"
                                                    placeholder="e.g., Dela Cruz"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleNameChange('lastName', e.target.value)}
                                                    className={`${styles.input} ${profileErrors.lastName ? styles.inputError : ''}`}
                                                />
                                            </div>
                                            {profileErrors.lastName && (
                                                <span className={styles.error}>{profileErrors.lastName}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="settingsEmail" className={styles.label}>Email Address</label>
                                        <div className={styles.inputWrapper}>
                                            <Mail size={16} className={styles.inputIcon} />
                                            <input
                                                id="settingsEmail"
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className={styles.inputDisabled}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '28px' }}>
                                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className={styles.contentCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconCircle} style={{ background: '#eff6ff', color: '#2563eb' }}>
                                        <KeyRound size={20} />
                                    </div>
                                    <div>
                                        <h2 className={styles.cardTitle}>Security & Password</h2>
                                        <p className={styles.cardSubtext}>Update your password to keep your account secure.</p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordSubmit}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="settingsNewPassword" className={styles.label}>New Password</label>
                                        <div className={styles.inputWrapper}>
                                            <Lock size={16} className={styles.inputIcon} />
                                            <input
                                                id="settingsNewPassword"
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                placeholder="••••••••"
                                                className={styles.input}
                                            />
                                            <button
                                                type="button"
                                                className={styles.passwordToggle}
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                            >
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="settingsConfirmPassword" className={styles.label}>Confirm New Password</label>
                                        <div className={styles.inputWrapper}>
                                            <Lock size={16} className={styles.inputIcon} />
                                            <input
                                                id="settingsConfirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                placeholder="••••••••"
                                                className={styles.input}
                                            />
                                            <button
                                                type="button"
                                                className={styles.passwordToggle}
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password Strength Checklist */}
                                    {pwd.length > 0 && (
                                        <div className={styles.strengthMeter}>
                                            <div className={styles.strengthTitle}>
                                                <span>Password Strength</span>
                                                <span style={{ color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span>
                                            </div>
                                            <div className={styles.strengthBarTrack}>
                                                <div className={styles.strengthBarFill} style={{ width: `${strengthScore}%`, backgroundColor: strengthColor }} />
                                            </div>
                                            <ul className={styles.reqList}>
                                                <li className={pwdReqs.length ? styles.reqItemValid : styles.reqItem}>
                                                    {pwdReqs.length ? <Check size={14} /> : <X size={14} />} At least 8 characters
                                                </li>
                                                <li className={pwdReqs.uppercase ? styles.reqItemValid : styles.reqItem}>
                                                    {pwdReqs.uppercase ? <Check size={14} /> : <X size={14} />} Uppercase letter
                                                </li>
                                                <li className={pwdReqs.lowercase ? styles.reqItemValid : styles.reqItem}>
                                                    {pwdReqs.lowercase ? <Check size={14} /> : <X size={14} />} Lowercase letter
                                                </li>
                                                <li className={pwdReqs.number ? styles.reqItemValid : styles.reqItem}>
                                                    {pwdReqs.number ? <Check size={14} /> : <X size={14} />} At least 1 number
                                                </li>
                                                <li className={pwdReqs.special ? styles.reqItemValid : styles.reqItem}>
                                                    {pwdReqs.special ? <Check size={14} /> : <X size={14} />} Special character
                                                </li>
                                            </ul>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '28px' }}>
                                        <button type="submit" disabled={savingPassword} className={styles.submitBtn} style={{ background: '#2563eb' }}>
                                            {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                            {savingPassword ? 'Updating Password...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className={styles.contentCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconCircle} style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
                                        <Bell size={20} />
                                    </div>
                                    <div>
                                        <h3 className={styles.cardTitle}>System & Interface Preferences</h3>
                                        <p className={styles.cardSubtext}>Customize live web alerts, map behavior, and default views.</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Real-Time Web Alerts</h4>
                                    
                                    <div className={styles.preferenceCard}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Live In-App Request Alerts</h4>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Displays an immediate pop-up banner when a partner organization submits a new bin request.</p>
                                        </div>
                                        <label className={styles.toggleSwitch}>
                                            <input
                                                type="checkbox"
                                                className={styles.toggleInput}
                                                checked={preferences.liveAlerts}
                                                onChange={() => handlePreferenceToggle('liveAlerts')}
                                            />
                                            <span className={styles.toggleSlider} />
                                        </label>
                                    </div>

                                    <div className={styles.preferenceCard}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Notification Sound Chime</h4>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Play an audio chime when new requests or urgent bin capacity alerts occur.</p>
                                        </div>
                                        <label className={styles.toggleSwitch}>
                                            <input
                                                type="checkbox"
                                                className={styles.toggleInput}
                                                checked={preferences.soundAlerts}
                                                onChange={() => handlePreferenceToggle('soundAlerts')}
                                            />
                                            <span className={styles.toggleSlider} />
                                        </label>
                                    </div>

                                    <div className={styles.preferenceCard}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Smart Bin Map Auto-Center</h4>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Automatically zoom and center map boundaries around registered smart bins.</p>
                                        </div>
                                        <label className={styles.toggleSwitch}>
                                            <input
                                                type="checkbox"
                                                className={styles.toggleInput}
                                                checked={preferences.autoCenterMap}
                                                onChange={() => handlePreferenceToggle('autoCenterMap')}
                                            />
                                            <span className={styles.toggleSlider} />
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Default Views & Display Options</h4>

                                    <div className={styles.preferenceCard}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Default Analytics Timeframe</h4>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Initial time filter when opening the Reports & Analytics page.</p>
                                        </div>
                                        <select
                                            value={preferences.defaultTimeframe}
                                            onChange={(e) => {
                                                const updated = { ...preferences, defaultTimeframe: e.target.value };
                                                setPreferences(updated);
                                                localStorage.setItem('recytech_preferences', JSON.stringify(updated));
                                                notify('Default timeframe updated.', 'info');
                                            }}
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', fontWeight: 600, outline: 'none', cursor: 'pointer', background: '#ffffff' }}
                                        >
                                            <option value="week">Last 7 Days</option>
                                            <option value="month">This Month</option>
                                            <option value="year">This Year</option>
                                        </select>
                                    </div>

                                    <div className={styles.preferenceCard}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Default Table Items Per Page</h4>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Number of rows displayed per page across table views.</p>
                                        </div>
                                        <select
                                            value={preferences.defaultPageSize}
                                            onChange={(e) => {
                                                const updated = { ...preferences, defaultPageSize: Number(e.target.value) };
                                                setPreferences(updated);
                                                localStorage.setItem('recytech_preferences', JSON.stringify(updated));
                                                notify('Default table page size updated.', 'info');
                                            }}
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', fontWeight: 600, outline: 'none', cursor: 'pointer', background: '#ffffff' }}
                                        >
                                            <option value={10}>10 rows</option>
                                            <option value={25}>25 rows</option>
                                            <option value={50}>50 rows</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;