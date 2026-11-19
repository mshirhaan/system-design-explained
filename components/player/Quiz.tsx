"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/components/scene/types";

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const correct = picked.filter((p, i) => p === questions[i].answer).length;

  return (
    <section className="quiz card" aria-labelledby="quiz-title">
      <div className="quiz-head">
        <h2 id="quiz-title">Check yourself</h2>
        <span className="tag">
          {answered === questions.length ? `${correct} / ${questions.length} correct` : `${answered} / ${questions.length} answered`}
        </span>
      </div>
      <ol className="quiz-list">
        {questions.map((q, qi) => {
          const p = picked[qi];
          return (
            <li key={qi} className="quiz-q">
              <p className="quiz-text">{q.q}</p>
              <div className="quiz-options" role="group" aria-label={q.q}>
                {q.options.map((o, oi) => {
                  const state = p === null ? "" : oi === q.answer ? "is-right" : oi === p ? "is-wrong" : "is-dim";
                  return (
                    <button
                      key={oi}
                      className={`quiz-opt ${state}`}
                      disabled={p !== null}
                      onClick={() => setPicked((arr) => arr.map((v, i) => (i === qi ? oi : v)))}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {p !== null && (
                <p className={`quiz-explain ${p === q.answer ? "ok" : "no"}`}>
                  <b>{p === q.answer ? "Right." : "Not quite."}</b> {q.explain}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {answered > 0 && (
        <button className="btn" onClick={() => setPicked(questions.map(() => null))}>
          Try again
        </button>
      )}
    </section>
  );
}
