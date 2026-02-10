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
            <BarChart data={data}>
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
                    tickFormatter={(value) => `Rp${value}`}
                />
                <Tooltip
                    formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Total"]}
                    contentStyle={{ backgroundColor: "#333", border: "none", color: "#fff" }}
                />
                <Bar
                    dataKey="total"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
