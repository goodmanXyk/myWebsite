"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  value: number;
}

export function BarTrend({ data, label }: { data: DataPoint[]; label?: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b6b6b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b6b6b" />
          <Tooltip
            cursor={{ fill: "#fafafa" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              background: "#fff",
            }}
          />
          <Bar
            dataKey="value"
            fill="#10a37f"
            radius={[4, 4, 0, 0]}
            name={label}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
