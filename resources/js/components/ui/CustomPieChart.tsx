import React from 'react';
import {
Cell,
Legend,
Pie,
PieChart,
ResponsiveContainer,
Tooltip,
} from 'recharts';

export interface PieChartItem {
    name: string;
    value: number;
    color?: string;
}

interface CustomPieChartProps {
    data: PieChartItem[];
    height?: number | string;
    colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (!percent || percent <= 0) return null;
    const RADIAN = Math.PI / 180;
    // Position text inside each pie slice segment
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontWeight: 700, fontSize: '13px', filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.4))' }}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const CustomPieChart: React.FC<CustomPieChartProps> = ({
    data,
    height = 280,
    colors = DEFAULT_COLORS,
}) => {
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="40%"
                        outerRadius={75}
                        innerRadius={0}
                        labelLine={false}
                        label={renderCustomizedLabel}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color || colors[index % colors.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [`${value}`, 'Số lượng']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        layout="horizontal"
                        iconType="square"
                        iconSize={12}
                        wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CustomPieChart;
