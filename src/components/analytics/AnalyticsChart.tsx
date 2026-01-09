'use client';

import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ChartData {
    date: string;
    [key: string]: string | number;
}

interface AnalyticsChartProps {
    data: ChartData[];
    type?: 'line' | 'bar' | 'area';
    dataKeys: { key: string; name: string; color: string }[];
    height?: number;
}

export default function AnalyticsChart({
    data,
    type = 'line',
    dataKeys,
    height = 300
}: AnalyticsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
                <p className="text-stone-400 font-bold uppercase text-[10px] tracking-widest">No intelligence data yet</p>
            </div>
        );
    }

    const getChartComponent = () => {
        switch (type) {
            case 'bar': return BarChart;
            case 'area': return AreaChart;
            default: return LineChart;
        }
    };

    const getDataComponent = () => {
        switch (type) {
            case 'bar': return Bar;
            case 'area': return Area;
            default: return Line;
        }
    };

    const ChartComponent = getChartComponent();
    const DataComponent = getDataComponent();

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    {dataKeys.map(({ key, color }) => (
                        <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={700}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                />
                <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={700}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : val.toLocaleString()}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '12px',
                        fontSize: '11px',
                        fontWeight: '800'
                    }}
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                />
                <Legend
                    wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }}
                    iconType="circle"
                />
                {dataKeys.map(({ key, name, color }) => (
                    <DataComponent
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={name}
                        stroke={color}
                        fill={type === 'area' ? `url(#grad-${key})` : color}
                        strokeWidth={3}
                        dot={type === 'line' ? { r: 4, strokeWidth: 2, fill: '#fff' } : false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                    />
                ))}
            </ChartComponent>
        </ResponsiveContainer>
    );
}
