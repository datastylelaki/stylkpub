"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface SalesChartProps {
    data: {
        name: string;
        total: number;
    }[];
}

export function SalesChart({ data }: SalesChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: any) => `Rp${value}`}
                    width={80}
                />
                <Tooltip
                    formatter={(value: number | undefined) => value ? [`Rp ${value.toLocaleString("id-ID")}`, "Total"] : ["Rp 0", "Total"]}
                    contentStyle={{ backgroundColor: "#333", border: "none", color: "#fff" }}
                    cursor={{ fill: 'transparent' }}
                />
                <Bar
                    dataKey="total"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
