'use client';

import { CaseTypeBreakdown, CaseAgeingOverview } from '@/lib/actions/analytics';

interface DonutChartProps {
    data: Array<{
        label: string;
        value: number;
        // percentage: number;
        color: string;
    }>;
    size?: number;
}

function DonutChart({ data, size = 160 }: DonutChartProps) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const innerRadius = radius * 0.5; // Thicker donut

    let currentAngle = -90; // Start from top

    const createArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + outerR * Math.cos(startRad);
        const y1 = centerY + outerR * Math.sin(startRad);
        const x2 = centerX + outerR * Math.cos(endRad);
        const y2 = centerY + outerR * Math.sin(endRad);
        const x3 = centerX + innerR * Math.cos(endRad);
        const y3 = centerY + innerR * Math.sin(endRad);
        const x4 = centerX + innerR * Math.cos(startRad);
        const y4 = centerY + innerR * Math.sin(startRad);

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    };

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
                </filter>
            </defs>
            {data.map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const angle = (percentage / 100) * 360;
                const path = createArc(currentAngle, currentAngle + angle, radius, innerRadius);
                currentAngle += angle;

                return (
                    <g key={index}>
                        <path
                            d={path}
                            fill={item.color}
                            className="hover:opacity-90 transition-opacity cursor-pointer"
                            filter="url(#shadow)"
                        />
                    </g>
                );
            })}
            {/* Center text showing total */}
            <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-3xl font-bold fill-midnightNavy"
            >
                {total}
            </text>
        </svg>
    );
}

interface CaseTypeChartProps {
    data: CaseTypeBreakdown[];
}

export function CaseTypeChart({ data }: CaseTypeChartProps) {
    const chartData = data.map(item => ({
        label: item.type,
        value: item.count,
        // percentage: item.percentage,
        color: item.color
    }));

    return (
        <div className="w-full max-w-sm mx-auto">
            <h3 className="text-sm font-regular text-mutedSteelBlue mb-2 text-center">
                Case Breakdown By Type
            </h3>
            <div className="grid grid-cols-[170px_1fr] gap-4 pt-4">
                <div className="flex justify-center items-start">
                    <DonutChart data={chartData} size={160} />
                </div>

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            ></span>
                            <div className="flex flex-col">
                                <span className="text-xs text-deepNavy font-regular">
                                    {item.type}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface CaseAgeingChartProps {
    data: CaseAgeingOverview[];
}

export function CaseAgeingChart({ data }: CaseAgeingChartProps) {
    const chartData = data.map(item => ({
        label: item.range,
        value: item.count,
        // percentage: item.percentage,
        color: item.color
    }));

    return (
        <div className="w-full max-w-sm mx-auto">
            <h3 className="text-sm font-regular text-mutedSteelBlue mb-2 text-center">
                Case Ageing Overview
            </h3>
            <div className="grid grid-cols-[170px_1fr] gap-4 pt-4">
                <div className="flex justify-center items-start">
                    <DonutChart data={chartData} size={160} />
                </div>

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            ></span>
                            <div className="flex flex-col">
                                <span className="text-xs text-deepNavy font-regular">
                                    {item.range}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
