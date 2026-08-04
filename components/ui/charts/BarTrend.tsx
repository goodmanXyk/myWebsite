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
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#a1a1a1" }} stroke="#3a3a3a" />
          <YAxis tick={{ fontSize: 12, fill: "#a1a1a1" }} stroke="#3a3a3a" />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #2a2a2a",
              background: "#1a1a1a",
              color: "#f5f5f5",
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
