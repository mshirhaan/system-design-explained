import type { Metadata } from "next";
import Link from "next/link";
import { Studio } from "@/components/lab/Studio";
import { CHALLENGES } from "@/lib/lab/challenges";

export const metadata: Metadata = {
  title: "Design Studio: build a system and watch it handle real traffic",
  description:
    "An interactive system design studio. Connect users, CDNs, load balancers, app servers, caches, queues and databases on an infinite canvas, then watch your design handle traffic, failures and a full 24-hour day. Eight challenges with stars.",
  alternates: { canonical: "/labs/sandbox" },
};

export default function SandboxPage() {
  return (
    <>
      <Studio />
      <div className="wrap studio-about">
        <article className="article card">
          <section>
            <h2>What is the Design Studio?</h2>
            <p>
              The Design Studio is a hands-on system design simulator. Instead of drawing boxes and arrows on paper, you build a
              system from real components (users, a CDN, load balancers, app servers, a Redis-style cache, a queue with workers,
              a main database and read replicas) and watch live traffic flow through it. Every block shows how busy it is, and
              blocks that can't keep up turn red and start dropping requests.
            </p>
            <p>
              The model behind it follows the same rules as real systems. Caches answer most reads; every write must reach the
              main database; replicas only add read capacity; a load balancer is needed to share traffic between app servers;
              and response times climb steeply as any component approaches 100% busy.
            </p>
          </section>
          <section>
            <h2>Challenges</h2>
            <p>
              Eight challenges take you from your first users to surviving a day of failures. Each sets goals for errors,
              response time and cost, and awards up to three stars for doing it cheaply:
            </p>
            <ul className="about-list">
              {CHALLENGES.map((c, i) => (
                <li key={c.id}>
                  <b>
                    {i + 1}. {c.title}.
                  </b>{" "}
                  {c.story}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Run a whole day</h2>
            <p>
              Day challenges play 24 hours of traffic in under a minute: quiet nights, evening peaks, flash sales and scheduled
              failures. Autoscaling adds app servers when they get busy (each takes five minutes to boot) and removes them when
              traffic drops, so you can see how capacity, cost and reliability trade off over time.
            </p>
            <p>
              New to these ideas? Start with <Link href="/course">the course</Link>: the lessons on load balancers, caching,
              read replicas and queues explain every behaviour you'll see here.
            </p>
          </section>
        </article>
      </div>
    </>
  );
}
