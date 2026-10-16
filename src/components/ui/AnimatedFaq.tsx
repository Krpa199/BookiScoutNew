import { ChevronDown } from 'lucide-react';

interface AnimatedFaqProps {
  items: { question: string; answer: string }[];
  /** How many questions start expanded (the first answers are the most-wanted ones). */
  openCount?: number;
}

/**
 * FAQ accordion on native <details>: no JS, answers always in the HTML (crawlers
 * and AI answer engines read them), keyboard accessible, and the chevron points
 * down — the old right-pointing arrow read like a link to another page.
 */
export default function AnimatedFaq({ items, openCount = 2 }: AnimatedFaqProps) {
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {items.map((item, index) => (
        <details
          key={index}
          open={index < openCount}
          className="group"
          itemScope
          itemProp="mainEntity"
          itemType="https://schema.org/Question"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 sm:py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="font-semibold text-slate-900 text-base sm:text-lg leading-snug" itemProp="name">
              {item.question}
            </span>
            <ChevronDown
              className="mt-1 h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="pb-5 -mt-1">
            <p className="text-base sm:text-[17px] text-slate-700 leading-relaxed" itemProp="text">
              {item.answer}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
