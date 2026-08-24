import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from 'recharts';
import Card from '@/components/ui/Card';
import CustomPieChart, { PieChartItem } from '@/components/ui/CustomPieChart';
import { PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';

export interface TuitionChartStatsData {
    status_pie: PieChartItem[];
    monthly_trend: Array<{
        month_key: string;
        name: string;
        total_amount: number;
        paid_amount: number;
        remaining_amount: number;
    }>;
}

interface TuitionChartSectionProps {
    chartStats: TuitionChartStatsData;
}

export const TuitionChartSection: React.FC<TuitionChartSectionProps> = ({ chartStats }) => {
    const formatCurrencyShort = (val: number) => {
        if (val >= 1_000_000_000) {
            return `${(val / 1_000_000_000).toFixed(1)} tỷ`;
        }
        if (val >= 1_000_000) {
            return `${(val / 1_000_000).toFixed(0)} triệu`;
        }
        if (val >= 1_000) {
            return `${(val / 1_000).toFixed(0)}k`;
        }
        return `${val}`;
    };

    const formatCurrencyFull = (val: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(val || 0);
    };

    const hasPieData = chartStats?.status_pie && chartStats.status_pie.some(item => item.value > 0);
    const hasTrendData = chartStats?.monthly_trend && chartStats.monthly_trend.some(item => item.total_amount > 0 || item.paid_amount > 0);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Pie Chart: Status Breakdown */}
            <Card className="border-gray-200 bg-white p-5 shadow-xs lg:col-span-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
                            <PieChartIcon className="h-5 w-5 text-emerald-600" />
                            Phân Bổ Trạng Thái Học Phí
                        </h3>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Tỷ lệ phần trăm hồ sơ học phí theo từng trạng thái hoàn thành.
                    </p>
                </div>

                <div className="my-2">
                    {hasPieData ? (
                        <CustomPieChart
                            data={chartStats.status_pie}
                            height={250}
                        />
                    ) : (
                        <div className="flex h-[250px] flex-col items-center justify-center text-center text-sm text-gray-400">
                            <PieChartIcon className="mb-2 h-10 w-10 text-gray-200" />
                            Chưa có dữ liệu thống kê trạng thái
                        </div>
                    )}
                </div>
            </Card>

            {/* Bar Chart: Monthly Revenue & Trend */}
            <Card className="border-gray-200 bg-white p-5 shadow-xs lg:col-span-8 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Xu Hướng Thu Học Phí (6 Tháng Gần Nhất)
                        </h3>
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <TrendingUp className="h-4 w-4" /> Doanh thu phát sinh & Thực thu
                        </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        So sánh tổng học phí phát sinh và số tiền thực tế đã thu được theo thời gian.
                    </p>
                </div>

                <div className="mt-4 h-[250px] w-full">
                    {hasTrendData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartStats.monthly_trend}
                                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis
                                    tickFormatter={formatCurrencyShort}
                                    tickLine={false}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={(value: any, name: any) => [
                                        formatCurrencyFull(Number(value)),
                                        name === 'total_amount' ? 'Tổng phải thu' : name === 'paid_amount' ? 'Đã thu' : 'Còn nợ',
                                    ]}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        fontSize: '12px',
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    formatter={(value) => (
                                        <span className="text-xs font-medium text-gray-700">
                                            {value === 'total_amount' ? 'Tổng Phải Thu' : 'Đã Thu Được'}
                                        </span>
                                    )}
                                />
                                <Bar
                                    dataKey="total_amount"
                                    fill="#93c5fd"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                                <Bar
                                    dataKey="paid_amount"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-400">
                            <BarChart3 className="mb-2 h-10 w-10 text-gray-200" />
                            Chưa có dữ liệu thống kê doanh thu theo tháng
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TuitionChartSection;
