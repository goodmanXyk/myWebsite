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
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#a1a1a1" }} stroke="#3a3a3a" />
          <YAxis tick={{ fontSize: 12, fill: "#a1a1a1" }} stroke="#3a3a3a" />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #2a2a2a",
              background: "#1a1a1a",
              color: "#f5f5f5",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0285ff"
            strokeWidth={2}
            dot={{ r: 3, fill: "#0285ff" }}
            activeDot={{ r: 5, fill: "#0285ff" }}
            name={label}
            connectNulls={connectNulls}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
