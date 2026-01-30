import { CheckCircle, XCircle, Minus } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  values: (boolean | string | null)[];
}

interface ComparisonTableProps {
  title: string;
  headers: string[];
  rows: ComparisonRow[];
}

export default function ComparisonTable({ title, headers, rows }: ComparisonTableProps) {
  const renderCell = (value: boolean | string | null) => {
    if (value === true) {
      return <CheckCircle className="w-5 h-5 text-seafoam-600 mx-auto" />;
    }
    if (value === false) {
      return <XCircle className="w-5 h-5 text-coral-500 mx-auto" />;
    }
    if (value === null) {
      return <Minus className="w-5 h-5 text-slate-300 mx-auto" />;
    }
    return <span className="text-slate-700 font-medium text-center block">{value}</span>;
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden shadow-soft">
      <div className="bg-gradient-ocean p-6">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 bg-slate-50">Feature</th>
              {headers.map((header, index) => (
                <th key={index} className="px-6 py-4 text-center text-sm font-bold text-slate-700 bg-slate-50">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.feature}</td>
                {row.values.map((value, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-sm">
                    {renderCell(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
