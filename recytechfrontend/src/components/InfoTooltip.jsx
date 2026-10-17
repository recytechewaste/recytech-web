import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

/**
 * Reusable InfoTooltip component with accessible hover/focus states,
 * smooth positioning, and impactful explanations.
 * 
 * @param {string|React.ReactNode} content - Impactful tooltip text or elements
 * @param {string} [title] - Optional bold header inside the tooltip
 * @param {number} [size=16] - Size of the info icon
 * @param {'top'|'bottom'|'left'|'right'} [position='bottom'] - Preferred alignment
 * @param {number} [width=240] - Tooltip popup width in px
 */
export const InfoTooltip = ({
    content,
    title,
    size = 16,
    position = 'bottom',
    width = 240,
    iconColor = '#94a3b8',
    hoverColor = '#0f766e'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const triggerRef = useRef(null);

    return (
        <span
            ref={triggerRef}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                verticalAlign: 'middle',
                cursor: 'help',
                color: isHovered ? hoverColor : iconColor,
                transition: 'color 0.15s ease',
                lineHeight: 1
            }}
            onMouseEnter={() => { setIsHovered(true); setIsVisible(true); }}
            onMouseLeave={() => { setIsHovered(false); setIsVisible(false); }}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            tabIndex={0}
            role="button"
            aria-label={typeof content === 'string' ? content : 'More information'}
        >
            <Info size={size} />

            {isVisible && (
                <span
                    role="tooltip"
                    style={{
                        position: 'absolute',
                        top: position === 'bottom' ? 'calc(100% + 8px)' : position === 'top' ? 'auto' : '50%',
                        bottom: position === 'top' ? 'calc(100% + 8px)' : 'auto',
                        left: position === 'right' ? 'calc(100% + 8px)' : position === 'left' ? 'auto' : '50%',
                        right: position === 'left' ? 'calc(100% + 8px)' : 'auto',
                        transform: (position === 'top' || position === 'bottom')
                            ? 'translateX(-50%)'
                            : position === 'left' || position === 'right'
                            ? 'translateY(-50%)'
                            : 'none',
                        width: `${width}px`,
                        maxWidth: '85vw',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        textAlign: 'left',
                        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        whiteSpace: 'normal',
                        border: '1px solid #334155',
                        animation: 'tooltipFade 0.15s ease-out'
                    }}
                >
                    {title && (
                        <span style={{ display: 'block', fontWeight: 600, color: '#38bdf8', marginBottom: '3px' }}>
                            {title}
                        </span>
                    )}
                    <span style={{ color: '#cbd5e1' }}>
                        {content}
                    </span>
                </span>
            )}
        </span>
    );
};

export default InfoTooltip;
