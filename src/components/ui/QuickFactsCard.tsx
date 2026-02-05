import { ReactNode } from 'react';

interface QuickFact {
  icon: ReactNode;
  label: string;
  value: string;
  color?: 'ocean' | 'seafoam' | 'coral' | 'sand';
}

interface QuickFactsCardProps {
  title?: string;
  facts: QuickFact[];
}

export default function QuickFactsCard({ title = "At a Glance", facts }: QuickFactsCardProps) {
  const colorClasses = {
    ocean: 'bg-ocean-500 text-white',
    seafoam: 'bg-seafoam-500 text-white',
    coral: 'bg-coral-500 text-white',
    sand: 'bg-sand-500 text-white',
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-slate-100 p-4 sm:p-5 md:p-6 lg:p-8 shadow-soft">
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {facts.map((fact, index) => (
          <div key={index} className="flex items-start gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft flex-shrink-0 ${colorClasses[fact.color || 'ocean']}`}>
              <span className="[&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">{fact.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-slate-500 font-medium mb-0.5">{fact.label}</p>
              <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{fact.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
