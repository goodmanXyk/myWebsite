"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  value: number | null;
}

export function LineTrend({
  data,
  label,
  connectNulls = false,
}: {
  data: DataPoint[];
  label?: string;
  connectNulls?: boolean;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6b6b6b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6b6b6b" />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              background: "#fff",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10a37f"
            strokeWidth={2}
            dot={{ r: 3, fill: "#10a37f" }}
            activeDot={{ r: 5, fill: "#10a37f" }}
            name={label}
            connectNulls={connectNulls}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
