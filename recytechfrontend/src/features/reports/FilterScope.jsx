import { Calendar, Filter, Landmark } from 'lucide-react';
import styles from '../../styles/Reports.module.css';

/**
 * Which report filters each component responds to.
 * Kept in one place so the labels always match the backend logic in getReportData.
 */
export const FILTER_SCOPES = {
    volume:       { period: true,  wasteType: true,  partnerOrg: true },
    requests:     { period: true,  wasteType: false, partnerOrg: true },
    bins:         { period: false, wasteType: false, partnerOrg: true },
    points:       { period: true,  wasteType: true,  partnerOrg: true },
    trend:        { period: true,  wasteType: true,  partnerOrg: true },
    distribution: { period: true,  wasteType: true,  partnerOrg: true },
    activity:     { period: true,  wasteType: false, partnerOrg: true }
};

const FILTERS = [
    { key: 'period', label: 'Period', Icon: Calendar },
    { key: 'wasteType', label: 'Waste Type', Icon: Filter },
    { key: 'partnerOrg', label: 'Partner Org', Icon: Landmark }
];

/**
 * Small chip row showing which filters affect a report component.
 * Filters that apply are highlighted; ones that don't are dimmed and struck through.
 */
const FilterScope = ({ scope, compact = false }) => {
    const config = FILTER_SCOPES[scope];
    if (!config) return null;

    return (
        <div
            className={`${styles.filterScope} ${compact ? styles.filterScopeCompact : ''}`}
            aria-label="Filters that affect this section"
        >
            {FILTERS.map(({ key, label, Icon }) => {
                const applies = config[key];
                return (
                    <span
                        key={key}
                        className={applies ? styles.scopeChipOn : styles.scopeChipOff}
                        title={applies ? `Responds to the ${label} filter` : `Not affected by the ${label} filter`}
                    >
                        <Icon size={compact ? 10 : 11} />
                        {label}
                    </span>
                );
            })}
        </div>
    );
};

export default FilterScope;
