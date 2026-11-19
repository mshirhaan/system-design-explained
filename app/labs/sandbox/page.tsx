import type { Metadata } from "next";
import Link from "next/link";
import { Sandbox } from "@/components/lab/Sandbox";

export const metadata: Metadata = {
  title: "Design Sandbox: build a system and send it traffic",
  description:
    "An interactive system design sandbox. Connect users, a CDN, load balancers, app servers, a cache and databases, then watch how your design handles real traffic, errors, latency and cost.",
  alternates: { canonical: "/labs/sandbox" },
};

export default function SandboxPage() {
  return (
    <div className="wrap">
      <header className="lesson-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/labs">Mastery Labs</Link>
          <span aria-hidden="true">/</span>
          <span>Design Sandbox</span>
        </nav>
        <div className="lesson-head-row">
          <h1>Design Sandbox</h1>
          <div className="lesson-tags-row">
            <span className="tag tag-violet">Lab</span>
            <span className="tag tag-green">Free during beta</span>
          </div>
        </div>
        <p className="lede">
          Build a system from blocks, send it traffic and watch what breaks. Each challenge sets goals for errors, speed and
          cost. Add load balancers, app servers, a cache or a CDN until every goal turns green.
        </p>
      </header>
      <Sandbox />
    </div>
  );
}
