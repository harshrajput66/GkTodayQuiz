import { CheckCircle, XCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const LABELS = { A: 'A', B: 'B', C: 'C', D: 'D' };

function OptionBadge({ label }) {
  return (
    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-700 flex-shrink-0 bg-slate-700 text-slate-200">
      {label}
    </span>
  );
}

export default function ReviewCard({ q, index, total }) {
  const { question, options, selectedAnswer, correctAnswer, isCorrect, explanation, sourcePdf } = q;

  return (
    <div className={`glass-card p-6 fade-in border-l-4 ${
      !selectedAnswer
        ? 'border-l-yellow-500'
        : isCorrect
        ? 'border-l-green-500'
        : 'border-l-red-500'
    }`}>
      {/* Question header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-xs font-600 text-slate-500 mt-1 flex-shrink-0">Q{index + 1}/{total}</span>
          <p className="text-slate-100 font-500 leading-relaxed">{question}</p>
        </div>
        <div className="flex-shrink-0">
          {!selectedAnswer ? (
            <span className="badge badge-primary">Skipped</span>
          ) : isCorrect ? (
            <span className="flex items-center gap-1 text-green-400 text-xs font-600">
              <CheckCircle className="w-4 h-4" /> Correct
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-400 text-xs font-600">
              <XCircle className="w-4 h-4" /> Wrong
            </span>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2.5 mb-5">
        {Object.entries(options).map(([key, value]) => {
          const isSelected = selectedAnswer === key;
          const isCorrectOpt = correctAnswer === key;

          let cls = 'option-card';
          if (isCorrectOpt) cls += ' correct';
          else if (isSelected && !isCorrectOpt) cls += ' incorrect';

          return (
            <div key={key} className={cls} style={{ cursor: 'default' }}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-700 flex-shrink-0 ${
                isCorrectOpt
                  ? 'bg-green-500/30 text-green-300'
                  : isSelected
                  ? 'bg-red-500/30 text-red-300'
                  : 'bg-slate-700/60 text-slate-400'
              }`}>
                {key}
              </span>
              <span className={`text-sm flex-1 ${
                isCorrectOpt ? 'text-green-300' : isSelected ? 'text-red-300' : 'text-slate-300'
              }`}>
                {value}
              </span>
              <div className="flex-shrink-0 flex gap-1">
                {isCorrectOpt && <CheckCircle className="w-4 h-4 text-green-400" />}
                {isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation — only shown when present */}
      {explanation && (
        <div className="bg-primary-500/8 border border-primary-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-600 text-primary-400 uppercase tracking-wide">Explanation</span>
            {sourcePdf && (
              <span className="ml-auto text-xs text-slate-500">📄 {sourcePdf}</span>
            )}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
