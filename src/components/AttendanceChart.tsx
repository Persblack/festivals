import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface YearData {
  year: number;
  attendance: number;
  notable_acts: string[];
}

interface AttendanceChartProps {
  data: YearData[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  const formatAttendance = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <div className="h-64 w-full rounded-xl bg-muted/50 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatAttendance}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1C1C1C",
              border: "1px solid #333",
              borderRadius: "12px",
              color: "#FAFAFA",
            }}
            labelStyle={{ color: "#FAFAFA", fontWeight: "bold" }}
            formatter={(value: number, name: string, props: any) => {
              const yearData = data.find((d) => d.year === props.payload.year);
              return [
                <div key="content" className="space-y-1">
                  <div className="font-semibold">
                    {formatAttendance(value)} attendees
                  </div>
                  {yearData?.notable_acts && (
                    <div className="text-xs text-gray-400">
                      {yearData.notable_acts.join(", ")}
                    </div>
                  )}
                </div>,
                "",
              ];
            }}
          />
          <Area
            type="monotone"
            dataKey="attendance"
            stroke="#3B82F6"
            strokeWidth={3}
            fill="url(#attendanceGradient)"
            dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
