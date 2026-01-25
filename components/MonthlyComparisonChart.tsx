import React, { useMemo, useState } from 'react';
import { MonthlySummary, MonthlyComparisonPoint } from '../types';
import { buildMonthlyComparisonData } from '../utils/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyComparisonChartProps {
  records: MonthlySummary[];
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  records,
}) => {
  const [range, setRange] = useState<'ALL' | '12' | '6'>('ALL');

  const chartData = useMemo(
    () => buildMonthlyComparisonData(records, range),
    [records, range]
  );

  return (
    <div className="hud-panel rounded-sm p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-6 bg-accent-purple"></div> {/* Changed color for distinction */}
        <div>
          <h3 className="text-xl font-bold text-neutral-light tracking-wide uppercase">
            月次比較
          </h3>
          <p className="text-[10px] text-neutral-muted font-mono uppercase tracking-widest font-bold">
            全期間の固定費比較
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-xs rounded-full ${range === 'ALL' ? 'bg-primary text-white' : 'bg-background-element text-neutral-muted'}`}
            onClick={() => setRange('ALL')}
          >
            全期間
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-full ${range === '12' ? 'bg-primary text-white' : 'bg-background-element text-neutral-muted'}`}
            onClick={() => setRange('12')}
          >
            12ヶ月
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-full ${range === '6' ? 'bg-primary text-white' : 'bg-background-element text-neutral-muted'}`}
            onClick={() => setRange('6')}
          >
            6ヶ月
          </button>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="label" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
              }}
              formatter={(value: any) => [`¥${value.toLocaleString()}`, '合計支払額']}
            />
            <Bar
              dataKey="totalPaid"
              fill="#8884d8" // Default bar color
              // Custom bar to show warning for hasNoItems
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                if (payload.hasNoItems) {
                  return (
                    <g>
                      <rect x={x} y={y} width={width} height={height} fill="#ffcc00" /> {/* Warning color */}
                      <text
                        x={x + width / 2}
                        y={y - 10}
                        fill="#ffcc00"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="16"
                      >
                        ⚠
                      </text>
                    </g>
                  );
                }
                return <rect x={x} y={y} width={width} height={height} fill="#00d4aa" />; // Normal color
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
