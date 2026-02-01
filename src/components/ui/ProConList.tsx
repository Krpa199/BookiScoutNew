import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ProConListProps {
  title?: string;
  pros?: string[];
  cons?: string[];
  prosLabel?: string;
  consLabel?: string;
}

export default function ProConList({ title, pros = [], cons = [], prosLabel = 'Advantages', consLabel = 'Disadvantages' }: ProConListProps) {
  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 shadow-soft">
      {title && (
        <h3 className="text-2xl font-bold text-slate-900 mb-6">{title}</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros */}
        {pros.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-seafoam-500 rounded-xl flex items-center justify-center shadow-soft">
                <ThumbsUp className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{prosLabel}</h4>
            </div>
            <ul className="space-y-3">
              {pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-3 bg-seafoam-50 p-4 rounded-xl border border-seafoam-100">
                  <div className="w-5 h-5 bg-seafoam-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-slate-800 text-sm leading-relaxed">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cons */}
        {cons.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-coral-500 rounded-xl flex items-center justify-center shadow-soft">
                <ThumbsDown className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{consLabel}</h4>
            </div>
            <ul className="space-y-3">
              {cons.map((con, index) => (
                <li key={index} className="flex items-start gap-3 bg-coral-50 p-4 rounded-xl border border-coral-100">
                  <div className="w-5 h-5 bg-coral-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✕</span>
                  </div>
                  <span className="text-slate-800 text-sm leading-relaxed">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
