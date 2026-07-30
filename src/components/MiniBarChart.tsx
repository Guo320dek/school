interface BarData { label: string; value: number; color?: string; }

interface MiniBarChartProps {
  data: BarData[];
  height?: number;
  maxValue?: number;
}

export default function MiniBarChart({ data, height = 100, maxValue }: MiniBarChartProps) {
  const actualMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = 24;
  const gap = 8;
  const chartH = height - 20;
  const totalW = data.length * (barWidth + gap) - gap;

  return (
    <svg width={totalW + 10} height={height} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / actualMax) * chartH, 2);
        const y = chartH - barH;
        return (
          <g key={d.label}>
            <rect
              x={i * (barWidth + gap)} y={y}
              width={barWidth} height={barH}
              rx={4} fill={d.color ?? '#5B6CF0'}
            />
            <text
              x={i * (barWidth + gap) + barWidth / 2}
              y={height - 4}
              textAnchor="middle" fontSize={10} fill="#888"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
