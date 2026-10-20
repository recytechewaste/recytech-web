import React from 'react';
import InfoTooltip from './InfoTooltip';
import styles from '../styles/PageHeader.module.css';
import { Sparkles } from 'lucide-react';

const PageHeader = ({
    icon,
    title,
    badge,
    badgeIcon,
    tooltipTitle,
    tooltipContent,
    subtitle,
    actions,
    className = '',
    style = {}
}) => {
    return (
        <header className={`${styles.header} ${className}`} style={style}>
            <div className={styles.titleArea}>
                {icon && (
                    <div className={styles.headerIcon}>
                        {icon}
                    </div>
                )}
                <div className={styles.titleContent}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.pageTitle}>{title}</h1>
                        {badge && (
                            <span className={styles.badge}>
                                {badgeIcon || <Sparkles size={11} />}
                                {badge}
                            </span>
                        )}
                        {(tooltipTitle || tooltipContent) && (
                            <InfoTooltip
                                title={tooltipTitle || title}
                                content={tooltipContent}
                                size={15}
                                position="bottom"
                                width={280}
                            />
                        )}
                    </div>
                    {subtitle && (
                        <p className={styles.subTitle}>{subtitle}</p>
                    )}
                </div>
            </div>

            {actions && (
                <div className={styles.actionsArea}>
                    {actions}
                </div>
            )}
        </header>
    );
};

export default PageHeader;
