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
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 shadow-soft">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {facts.map((fact, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-soft flex-shrink-0 ${colorClasses[fact.color || 'ocean']}`}>
              {fact.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500 font-medium mb-0.5">{fact.label}</p>
              <p className="text-base font-bold text-slate-900">{fact.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
