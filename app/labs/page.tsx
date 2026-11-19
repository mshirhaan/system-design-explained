import type { Metadata } from "next";
import Link from "next/link";
import { TrackCube } from "@/components/site/TrackCube";
import type { TrackColor } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Mastery Labs: practise system design hands-on",
  description: "Hands-on system design practice: a design sandbox with live traffic, scale challenges, incident drills, estimation runs and mock interviews.",
  alternates: { canonical: "/labs" },
};

const LABS: { title: string; text: string; color: TrackColor; href?: string }[] = [
  { title: "Design Sandbox", text: "Build a system from blocks, send it traffic and watch where it breaks. Includes three scale challenges.", color: "blue", href: "/labs/sandbox" },
  { title: "Scale challenges", text: "Your design must survive 10×, then 100× traffic, on a budget. Fix whatever breaks.", color: "green", href: "/labs/sandbox" },
  { title: "Incident drills", text: "A live system misbehaves. Read the dashboards, find the cause, apply the fix.", color: "orange" },
  { title: "Estimation speed runs", text: "Timed back-of-the-envelope rounds: users, requests per second, storage and bandwidth.", color: "yellow" },
  { title: "Trade-off duels", text: "Two designs, one requirement. Decide which wins and explain why.", color: "purple" },
  { title: "Spaced review", text: "Short daily cards from the lessons you've finished, timed so ideas stick.", color: "pink" },
  { title: "Timed mock interviews", text: "45-minute design rounds with a rubric, a model answer and feedback.", color: "blue" },
  { title: "Architecture teardowns", text: "Walk through how well-known systems are built, step by animated step.", color: "green" },
];

export default function LabsPage() {
  return (
    <div className="wrap">
      <header className="page-head">
        <span className="eyebrow">Mastery Labs</span>
        <h1>
          Practise until it's <mark>second nature</mark>.
        </h1>
        <p>Lessons explain how systems work. Labs make you build, break and fix them yourself. Start with the Design Sandbox.</p>
      </header>
      <div className="labs-grid">
        {LABS.map((l) => {
          const body = (
            <>
              <TrackCube color={l.color} className="track-ico" />
              <div>
                <h2>{l.title}</h2>
                <p>{l.text}</p>
              </div>
              <span className={`tag ${l.href ? "tag-green" : "tag-muted"}`}>{l.href ? "Try it now" : "Coming soon"}</span>
            </>
          );
          return l.href ? (
            <Link key={l.title} href={l.href} className="lab-card card-pop">
              {body}
            </Link>
          ) : (
            <div key={l.title} className="lab-card card-pop is-soon">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
