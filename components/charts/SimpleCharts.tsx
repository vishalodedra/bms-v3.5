import React from 'react';

// --- Types ---
export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number; // For comparison/grouped charts
  color?: string;
}

interface BaseChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

// --- Wrapper Component ---
export const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({ 
  title, subtitle, children, className 
}) => (
  <div className={`bg-white p-4 rounded-lg shadow-sm border border-industrial-border flex flex-col h-full ${className}`}>
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
    <div className="flex-1 w-full min-h-[160px] relative">
      {children}
    </div>
  </div>
);

// --- Line Chart (Trend) ---
export const SimpleLineChart = React.memo<BaseChartProps>(({ data, height = 160, color = '#0ea5e9' }) => {
  const maxVal = Math.max(...data.map(d => d.value)) * 1.1; // 10% buffer
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / maxVal) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full flex flex-col justify-end" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        {/* Grid Lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
        
        {/* Comparison Area (Mock Target) */}
        <path d="M0,40 L100,40" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4" />

        {/* The Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Dots */}
        {data.map((d, i) => {
           const x = (i / (data.length - 1)) * 100;
           const y = 100 - (d.value / maxVal) * 100;
           return (
             <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                <title>{d.label}: {d.value}</title>
             </circle>
           );
        })}
      </svg>
      {/* X Axis Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono">
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
});

// --- Bar Chart (Vertical) ---
export const SimpleBarChart = React.memo<BaseChartProps>(({ data, height = 160, color = '#3b82f6' }) => {
  const maxVal = Math.max(...data.map(d => d.value)) * 1.1;

  return (
    <div className="w-full h-full flex flex-col" style={{ height }}>
      <div className="flex-1 flex items-end justify-between gap-1 relative">
         {/* Background Grid Lines */}
         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
            <div className="border-t border-slate-100 w-full h-0"></div>
            <div className="border-t border-slate-100 w-full h-0"></div>
            <div className="border-t border-slate-100 w-full h-0"></div>
            <div className="border-t border-slate-100 w-full h-0"></div>
         </div>

         {data.map((d, i) => (
           <div key={i} className="flex-1 flex flex-col justify-end items-center h-full z-10 group relative">
              <div 
                className="w-4/5 rounded-t transition-all duration-500 group-hover:opacity-80"
                style={{ 
                  height: `${(d.value / maxVal) * 100}%`, 
                  backgroundColor: d.color || color 
                }}
              >
                 {/* Tooltip */}
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {d.value} units
                 </div>
              </div>
           </div>
         ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-1">
         {data.map((d, i) => (
           <div key={i} className="flex-1 text-center truncate px-0.5" title={d.label}>{d.label}</div>
         ))}
      </div>
    </div>
  );
});

// --- Donut Chart ---
export const SimpleDonutChart = React.memo<BaseChartProps>(({ data, height = 160 }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="w-full h-full flex items-center justify-center gap-6" style={{ height }}>
       {/* The Chart */}
       <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
            {data.map((d, i) => {
              const percent = d.value / total;
              const strokeDasharray = `${percent * 100} 100`;
              const strokeDashoffset = -cumulativePercent * 100;
              cumulativePercent += percent;
              
              return (
                <circle
                  key={i}
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={d.color || '#cbd5e1'}
                  strokeWidth="6"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all hover:opacity-80"
                >
                  <title>{d.label}: {d.value}</title>
                </circle>
              );
            })}
            {/* Center Text */}
            <g className="rotate-90 origin-center">
               <text x="50%" y="50%" textAnchor="middle" dy="0.3em" className="text-[0.4rem] fill-slate-700 font-bold">
                 {total.toLocaleString()}
               </text>
            </g>
          </svg>
       </div>

       {/* Legend */}
       <div className="flex flex-col gap-2">
          {data.map((d, i) => (
             <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                <div className="flex flex-col leading-none">
                   <span className="font-medium">{d.label}</span>
                   <span className="text-[10px] text-slate-400">{((d.value / total) * 100).toFixed(1)}%</span>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
});

// --- Comparison Bar Chart (Planned vs Actual) ---
export const GroupedBarChart = React.memo<BaseChartProps>(({ data, height = 160 }) => {
  const maxVal = Math.max(...data.flatMap(d => [d.value, d.value2 || 0])) * 1.1;

  return (
    <div className="w-full h-full flex flex-col" style={{ height }}>
      <div className="flex-1 flex items-end justify-between gap-4 relative px-2">
         {/* BG Grid */}
         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
            <div className="border-t border-slate-100 w-full h-0"></div>
            <div className="border-t border-slate-100 w-full h-0"></div>
            <div className="border-t border-slate-100 w-full h-0"></div>
         </div>

         {data.map((d, i) => (
           <div key={i} className="flex-1 flex gap-1 justify-center h-full items-end relative z-10">
              {/* Bar 1: Planned (Gray) */}
              <div 
                className="w-3 rounded-t bg-slate-300 hover:bg-slate-400 transition-colors relative group"
                style={{ height: `${((d.value2 || 0) / maxVal) * 100}%` }}
              >
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 pointer-events-none">
                    Plan:{d.value2}
                 </div>
              </div>
              
              {/* Bar 2: Actual (Color) */}
              <div 
                className="w-3 rounded-t bg-brand-600 hover:bg-brand-700 transition-colors relative group"
                style={{ height: `${(d.value / maxVal) * 100}%` }}
              >
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[9px] text-brand-700 font-bold opacity-0 group-hover:opacity-100 pointer-events-none">
                    Act:{d.value}
                 </div>
              </div>
           </div>
         ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-1">
         {data.map((d, i) => (
           <div key={i} className="flex-1 text-center">{d.label}</div>
         ))}
      </div>
      {/* Mini Legend */}
      <div className="flex justify-center gap-4 mt-1 text-[9px] text-slate-400">
         <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300 rounded-full"></div> Planned</span>
         <span className="flex items-center gap-1"><div className="w-2 h-2 bg-brand-600 rounded-full"></div> Actual</span>
      </div>
    </div>
  );
});