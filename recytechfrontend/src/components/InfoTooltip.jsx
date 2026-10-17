import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

/**
 * Reusable InfoTooltip component with accessible hover/focus states,
 * smooth positioning via React Portal (immune to overflow: hidden clipping),
 * and impactful explanations.
 * 
 * @param {string|React.ReactNode} content - Impactful tooltip text or elements
 * @param {string} [title] - Optional bold header inside the tooltip
 * @param {number} [size=16] - Size of the info icon
 * @param {'top'|'bottom'|'left'|'right'} [position='bottom'] - Preferred alignment
 * @param {number} [width=240] - Tooltip popup width in px
 * @param {string} [iconColor='#94a3b8']
 * @param {string} [hoverColor='#0f766e']
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
    const [coords, setCoords] = useState(null);
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);

    useLayoutEffect(() => {
        if (!isVisible || !triggerRef.current) return;

        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const tooltipEl = tooltipRef.current;
            const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 80;
            const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : Math.min(width, window.innerWidth - 24);

            let actualPos = position;
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;

            // Auto-flip if tight on screen viewport bounds
            if (position === 'top' && spaceAbove < tooltipHeight + 12 && spaceBelow > spaceAbove) {
                actualPos = 'bottom';
            } else if (position === 'bottom' && spaceBelow < tooltipHeight + 12 && spaceAbove > spaceBelow) {
                actualPos = 'top';
            }

            let computedTop = 0;
            if (actualPos === 'top') {
                computedTop = rect.top - tooltipHeight - 8;
            } else if (actualPos === 'bottom') {
                computedTop = rect.bottom + 8;
            } else if (actualPos === 'left' || actualPos === 'right') {
                computedTop = rect.top + rect.height / 2 - tooltipHeight / 2;
            }

            let computedLeft = 0;
            if (actualPos === 'left') {
                computedLeft = rect.left - tooltipWidth - 8;
            } else if (actualPos === 'right') {
                computedLeft = rect.right + 8;
            } else {
                const triggerCenter = rect.left + rect.width / 2;
                computedLeft = triggerCenter - tooltipWidth / 2;
            }

            // Clamp strictly inside viewport so tooltip is 100% visible
            computedLeft = Math.max(12, Math.min(computedLeft, window.innerWidth - tooltipWidth - 12));
            computedTop = Math.max(8, Math.min(computedTop, window.innerHeight - tooltipHeight - 8));

            setCoords({
                top: Math.round(computedTop),
                left: Math.round(computedLeft),
                actualPosition: actualPos
            });
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible, position, width]);

    const handleMouseEnter = () => {
        setIsHovered(true);
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsVisible(false);
        setCoords(null);
    };

    const handleFocus = () => {
        setIsVisible(true);
    };

    const handleBlur = () => {
        setIsVisible(false);
        setCoords(null);
    };

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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={0}
            role="button"
            aria-label={typeof content === 'string' ? content : 'More information'}
        >
            <Info size={size} />

            {isVisible && typeof document !== 'undefined' && createPortal(
                <span
                    ref={tooltipRef}
                    role="tooltip"
                    style={{
                        position: 'fixed',
                        top: coords ? `${coords.top}px` : '-9999px',
                        left: coords ? `${coords.left}px` : '-9999px',
                        width: `${Math.min(width, typeof window !== 'undefined' ? window.innerWidth - 24 : width)}px`,
                        maxWidth: 'calc(100vw - 24px)',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        textAlign: 'left',
                        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
                        zIndex: 999999,
                        pointerEvents: 'none',
                        whiteSpace: 'normal',
                        border: '1px solid #334155',
                        opacity: coords ? 1 : 0,
                        transition: 'opacity 0.15s ease-out',
                        wordBreak: 'break-word'
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
                </span>,
                document.body
            )}
        </span>
    );
};

export default InfoTooltip;
