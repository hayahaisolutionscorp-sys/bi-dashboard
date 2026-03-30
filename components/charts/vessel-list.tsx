interface VesselPerformanceItem {
  name: string;
  loadFactor: number;
  revenue: string;
  colorClass: string;
}

interface VesselListProps {
  data: VesselPerformanceItem[];
}

export function VesselList({ data }: VesselListProps) {
  return (
    <div className="space-y-4">
      {data.map((vessel, index) => (
        <div 
          key={index}
          className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-between group hover:bg-white dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${vessel.colorClass}`}>
              <span className="material-icons-outlined">directions_boat</span>
            </div>
            <div>
              <p className="text-xs font-bold">{vessel.name}</p>
              <p className="text-[10px] text-slate-500">Load Factor: {vessel.loadFactor}%</p>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{vessel.revenue}</p>
        </div>
      ))}
      <button className="w-full mt-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors">
        View All Vessels
      </button>
    </div>
  );
}
