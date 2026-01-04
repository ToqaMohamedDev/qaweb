/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        DATA CARD - بطاقة بيانات                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DataCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        label?: string;
        isPositive?: boolean;
    };
    footer?: React.ReactNode;
    color?: 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    isLoading?: boolean;
    onClick?: () => void;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function DataCard({
    title,
    value,
    icon,
    trend,
    footer,
    color = 'default',
    isLoading,
    onClick,
    className = '',
}: DataCardProps) {
    const colorClasses = {
        default: 'card-default',
        blue: 'card-blue',
        green: 'card-green',
        yellow: 'card-yellow',
        red: 'card-red',
        purple: 'card-purple',
    };

    return (
        <div
            className={`data-card ${colorClasses[color]} ${onClick ? 'clickable' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="data-card-header">
                <span className="data-card-title">{title}</span>
                {icon && <span className="data-card-icon">{icon}</span>}
            </div>

            <div className="data-card-body">
                {isLoading ? (
                    <div className="data-card-loading">
                        <div className="skeleton"></div>
                    </div>
                ) : (
                    <span className="data-card-value">{value}</span>
                )}

                {trend && !isLoading && (
                    <div className={`data-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
                        <span className="trend-arrow">{trend.isPositive ? '↑' : '↓'}</span>
                        <span className="trend-value">{Math.abs(trend.value)}%</span>
                        {trend.label && <span className="trend-label">{trend.label}</span>}
                    </div>
                )}
            </div>

            {footer && (
                <div className="data-card-footer">
                    {footer}
                </div>
            )}

            <style jsx>{`
                .data-card {
                    display: flex;
                    flex-direction: column;
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.75rem;
                    padding: 1.25rem;
                    transition: all 0.2s ease;
                }
                
                :global(.dark) .data-card {
                    background-color: #1f2937;
                    border-color: #374151;
                }
                
                .data-card.clickable {
                    cursor: pointer;
                }
                
                .data-card.clickable:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .card-blue { border-left: 4px solid #3b82f6; }
                .card-green { border-left: 4px solid #10b981; }
                .card-yellow { border-left: 4px solid #f59e0b; }
                .card-red { border-left: 4px solid #ef4444; }
                .card-purple { border-left: 4px solid #8b5cf6; }
                
                .data-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }
                
                .data-card-title {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #6b7280;
                }
                
                :global(.dark) .data-card-title {
                    color: #9ca3af;
                }
                
                .data-card-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 0.5rem;
                    background-color: #f3f4f6;
                    color: #6b7280;
                }
                
                :global(.dark) .data-card-icon {
                    background-color: #374151;
                    color: #9ca3af;
                }
                
                .card-blue .data-card-icon { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .card-green .data-card-icon { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
                .card-yellow .data-card-icon { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .card-red .data-card-icon { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .card-purple .data-card-icon { background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                
                .data-card-body {
                    display: flex;
                    align-items: baseline;
                    gap: 0.75rem;
                }
                
                .data-card-value {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #111827;
                    line-height: 1;
                }
                
                :global(.dark) .data-card-value {
                    color: #f9fafb;
                }
                
                .data-card-trend {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                }
                
                .data-card-trend.positive {
                    color: #10b981;
                }
                
                .data-card-trend.negative {
                    color: #ef4444;
                }
                
                .trend-label {
                    color: #9ca3af;
                    margin-right: 0.25rem;
                }
                
                .data-card-footer {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                :global(.dark) .data-card-footer {
                    border-color: #374151;
                    color: #9ca3af;
                }
                
                .data-card-loading {
                    flex: 1;
                }
                
                .skeleton {
                    height: 2rem;
                    width: 4rem;
                    border-radius: 0.25rem;
                    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                
                :global(.dark) .skeleton {
                    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
                    background-size: 200% 100%;
                }
                
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
