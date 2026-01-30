import { FileText } from 'lucide-react';

interface SummaryBoxProps {
  title?: string;
  items: string[];
}

export default function SummaryBox({ title = "TL;DR - Quick Summary", items }: SummaryBoxProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl border-2 border-purple-200 p-6 md:p-8 shadow-soft">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-soft">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 bg-white/80 p-4 rounded-xl border border-purple-100">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </div>
            <span className="text-slate-800 leading-relaxed font-medium">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
