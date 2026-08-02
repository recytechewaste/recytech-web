import { PackageOpen, Users, Truck, Recycle, ClipboardList, Coins, History } from 'lucide-react';

const ICON_MAP = {
    collectors: Truck,
    users: Users,
    bins: Recycle,
    requests: ClipboardList,
    rewards: Coins,
    history: History,
    default: PackageOpen,
};

/**
 * EmptyState — shown when a data table has no rows.
 *
 * Props:
 *   icon       - key from ICON_MAP (e.g. 'collectors', 'users') or omit for generic
 *   title      - main heading (e.g. "No collectors yet")
 *   subtitle   - secondary help text
 *   action     - optional { label: string, onClick: fn } to render a CTA button
 */
const EmptyState = ({
    icon = 'default',
    title = 'Nothing here yet',
    subtitle = 'Add a new entry to get started.',
    action = null,
}) => {
    const Icon = ICON_MAP[icon] || ICON_MAP.default;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            gap: '12px',
            textAlign: 'center',
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px',
            }}>
                <Icon size={28} strokeWidth={1.5} style={{ color: '#059669' }} />
            </div>

            <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: '#111827',
                fontFamily: "'Inter', sans-serif",
            }}>
                {title}
            </h3>

            <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#6b7280',
                maxWidth: '320px',
                lineHeight: 1.5,
                fontFamily: "'Inter', sans-serif",
            }}>
                {subtitle}
            </p>

            {action && (
                <button
                    onClick={action.onClick}
                    style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
                        fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.2)'; }}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
