'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      className={`group bg-white border-2 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 ${
        isOpen
          ? 'border-ocean-300 shadow-soft'
          : 'border-slate-100 hover:border-ocean-200 hover:shadow-soft'
      }`}
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 sm:px-6 py-4 sm:py-5 text-left hover:bg-gradient-ocean-subtle transition-all"
        aria-expanded={isOpen}
      >
        <span
          className="font-bold text-slate-900 pr-3 sm:pr-4 text-sm sm:text-base md:text-lg"
          itemProp="name"
        >
          {question}
        </span>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
            isOpen
              ? 'bg-ocean-500 rotate-90'
              : 'bg-ocean-100 group-hover:bg-ocean-500'
          }`}
        >
          <ChevronRight
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
              isOpen ? 'text-white' : 'text-ocean-600 group-hover:text-white'
            }`}
          />
        </div>
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ maxHeight: height }}
      >
        <div
          ref={contentRef}
          className="px-4 sm:px-6 pb-4 sm:pb-5 border-t-2 border-slate-100 bg-gradient-to-br from-white to-slate-50"
          itemScope
          itemProp="acceptedAnswer"
          itemType="https://schema.org/Answer"
        >
          <p
            className="pt-4 sm:pt-5 text-sm sm:text-base text-slate-700 leading-relaxed"
            itemProp="text"
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AnimatedFaqProps {
  items: { question: string; answer: string }[];
}

export default function AnimatedFaq({ items }: AnimatedFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3 md:space-y-4">
      {items.map((item, index) => (
        <FaqItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
}
