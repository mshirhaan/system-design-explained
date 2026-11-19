import type { LessonContent } from "@/components/scene/types";

const lesson: LessonContent = {
  slug: "dns-from-the-inside",
  intro:
    "Your laptop asks one question: where is shop.example.com? Behind it, a resolver walks a chain of servers from the root of the internet down to the domain's own name server, then remembers the answer.",
  learn: [
    "What a DNS resolver does for you",
    "The chain: root, top-level domain and authoritative servers",
    "What a TTL is, and why answers are cached",
    "Why the second lookup is almost free",
    "Why DNS changes take time to spread",
  ],
  keyIdea:
    "DNS is a distributed, cached phone book. No single server knows every name; each level points to the next. Caching at every step is what makes it fast enough to use on every page load.",
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "root", kind: "box", at: [40, -110], w: 50, h: 50, color: "pink", icon: "globe", name: "root ( . )" },
      { id: "tld", kind: "box", at: [250, -10], w: 50, h: 50, color: "green", icon: "search", name: ".com servers" },
      { id: "desk", kind: "slab", at: [-360, 222], w: 110, h: 14, name: "your laptop", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-360, 208] },
      { id: "resolver", kind: "box", at: [-120, 70], w: 62, h: 62, color: "purple", icon: "search", name: "resolver" },
      { id: "auth", kind: "box", at: [330, 170], w: 50, h: 50, color: "orange", icon: "key", name: "example.com DNS" },
    ],
    points: {
      lap: [-278, 160],
      res: [-160, 60],
      res2: [-80, 20],
      root: [10, -110],
      tld: [215, -10],
      auth: [295, 165],
      lapLabel: [-380, 40],
      resLabel: [-170, -58],
      rootLabel: [40, -205],
      tldLabel: [290, -115],
      authLabel: [330, 280],
    },
  },
  phases: [
    { id: "ask", label: "Ask", ms: 2, color: "#c9b8e5" },
    { id: "root", label: "Root", ms: 20, color: "#e8a9bd" },
    { id: "tld", label: ".com", ms: 20, color: "#b0d59c" },
    { id: "auth", label: "Authoritative", ms: 25, color: "#f2b27c" },
    { id: "answer", label: "Answer", ms: 2, color: "#a7c3e7" },
  ],
  steps: [
    {
      title: "Ask the resolver",
      body:
        "Your laptop doesn't search the internet itself. It sends one question to a DNS resolver, usually run by your internet provider or a public service: what's the address of shop.example.com?",
      links: [{ from: "lap", to: "res", style: "dashed" }],
      packets: [{ path: ["lap", "res"], kind: "request", at: 0.4, dur: 1.1, tag: "shop.example.com?" }],
      labels: [{ at: "resLabel", text: "not in my cache", icon: "search", tone: "muted", from: 1.6 }],
      timing: { done: [], active: "ask" },
    },
    {
      title: "Start at the root",
      body:
        "The resolver starts at the top. Root servers don't know every website, but they know who runs each top-level domain. The root's answer: I don't know shop.example.com, but here are the .com servers.",
      links: [{ from: "res2", to: "root", both: true }],
      packets: [
        { path: ["res2", "root"], kind: "request", at: 0.3, dur: 1.1, tag: "where is .com?" },
        { path: ["root", "res2"], kind: "response", at: 1.7, dur: 1.1, tag: "ask .com servers" },
      ],
      labels: [{ at: "rootLabel", text: "13 root server names, worldwide", icon: "globe", from: 0.2 }],
      timing: { done: ["ask"], active: "root" },
    },
    {
      title: "Ask the .com servers",
      body:
        "Next the resolver asks the .com servers. They don't know the address either, but they know which name server is in charge of example.com, and send the resolver there.",
      links: [{ from: "res2", to: "tld", both: true }],
      packets: [
        { path: ["res2", "tld"], kind: "request", at: 0.3, dur: 1.2, tag: "where is example.com?" },
        { path: ["tld", "res2"], kind: "response", at: 1.8, dur: 1.2, tag: "ask example.com DNS" },
      ],
      labels: [{ at: "tldLabel", text: "I know who runs it", icon: "search", tone: "green", from: 1.4 }],
      timing: { done: ["ask", "root"], active: "tld" },
    },
    {
      title: "The authoritative answer",
      body:
        "Finally the resolver reaches the authoritative name server for example.com, the one the domain owner controls. It holds the real record: shop.example.com is at 93.184.216.34, valid for 300 seconds.",
      links: [{ from: "res2", to: "auth", both: true }],
      packets: [
        { path: ["res2", "auth"], kind: "request", at: 0.3, dur: 1.2, tag: "shop.example.com?" },
        { path: ["auth", "res2"], kind: "response", at: 1.8, dur: 1.2, tag: "93.184.216.34 · TTL 300" },
      ],
      labels: [{ at: "authLabel", text: "A record: 93.184.216.34", icon: "key", tone: "orange", from: 1.4 }],
      timing: { done: ["ask", "root", "tld"], active: "auth" },
    },
    {
      title: "Answer, and remember it",
      body:
        "The resolver passes the address back to your laptop and caches it for the TTL, here 5 minutes. Your laptop and browser cache it too. The whole chain took about 70 ms.",
      focus: ["resolver"],
      links: [{ from: "res", to: "lap" }],
      packets: [{ path: ["res", "lap"], kind: "response", at: 0.3, dur: 1.1, tag: "93.184.216.34" }],
      labels: [
        { at: "resLabel", text: "cached for 5 min", icon: "clock", tone: "violet", from: 0.2 },
        { at: "lapLabel", text: "got the address", icon: "check", tone: "green", from: 1.5 },
      ],
      timing: { done: ["ask", "root", "tld", "auth", "answer"] },
    },
    {
      title: "The next lookup is nearly free",
      body:
        "Someone else on the same network looks up shop.example.com a minute later. The resolver answers straight from its cache in about 1 ms, with no root, .com or authoritative trips at all.",
      note: "Most DNS lookups are cache hits. That's why DNS can handle the whole internet's traffic.",
      links: [{ from: "lap", to: "res", both: true }],
      packets: [
        { path: ["lap", "res"], kind: "request", at: 0.3, dur: 0.8, tag: "shop.example.com?" },
        { path: ["res", "lap"], kind: "response", at: 1.2, dur: 0.8, tag: "93.184.216.34" },
      ],
      labels: [{ at: "resLabel", text: "cache hit · ~1 ms", icon: "bolt", tone: "green", from: 1 }],
    },
    {
      title: "When the TTL runs out",
      body:
        "After 5 minutes the cached answer expires and the next lookup walks the chain again. That's why changing a DNS record takes time to reach everyone: old answers live on in caches until their TTL ends.",
      note: "Planning a server move? Lower the TTL a day ahead, so the change spreads quickly when you make it.",
      labels: [
        { at: "resLabel", text: "TTL expired → ask again", icon: "clock", tone: "orange", from: 0.3 },
        { at: "authLabel", text: "new IP? caches catch up later", icon: "key", tone: "muted", from: 1.2 },
      ],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "Which server actually holds the record for shop.example.com?",
      options: ["A root server", "The .com server", "The authoritative name server for example.com", "Your laptop"],
      answer: 2,
      explain: "Root and .com servers only point the way. The authoritative server, controlled by the domain owner, holds the real records.",
    },
    {
      q: "What does a TTL of 300 on a DNS answer mean?",
      options: [
        "The site has 300 servers",
        "The answer may be cached for 300 seconds",
        "The lookup took 300 ms",
        "The record expires after 300 visits",
      ],
      answer: 1,
      explain: "TTL is the time to live: how long resolvers and devices may reuse the answer before asking again.",
    },
    {
      q: "You changed your site's IP address, but some users still reach the old server. Why?",
      options: [
        "DNS is broken",
        "Their resolvers still have the old answer cached until its TTL expires",
        "The root server rejected the change",
        "Browsers never update DNS",
      ],
      answer: 1,
      explain: "Caches hold the old record until the TTL runs out. Lowering the TTL before a change makes it spread faster.",
    },
  ],
  article: [
    {
      heading: "How does DNS resolution work?",
      paragraphs: [
        "When you visit a site, your device asks a recursive resolver for the domain's IP address. If the resolver doesn't have it cached, it walks the DNS hierarchy: first a root server, which points to the servers for the top-level domain (.com, .org, .io…), which point to the authoritative name server for the domain itself. The authoritative server returns the record, and the resolver passes it back to you.",
      ],
    },
    {
      heading: "Root, TLD and authoritative servers",
      paragraphs: [
        "There are 13 named root server identities, run by different organisations and copied to hundreds of locations worldwide using anycast. Top-level domain servers are run by registries, such as Verisign for .com. Authoritative servers are run by whoever manages the domain, often a DNS provider like Cloudflare or Route 53.",
        "Common record types include A (an IPv4 address), AAAA (IPv6), CNAME (an alias to another name), MX (mail servers) and TXT (free-form text, often for verification).",
      ],
    },
    {
      heading: "Caching and TTL",
      paragraphs: [
        "Every DNS answer carries a TTL, a number of seconds it may be cached. Browsers, operating systems and resolvers all cache answers, so most lookups are answered in about a millisecond without leaving your network. A full uncached lookup might take 50–150 ms.",
        "The trade-off: long TTLs mean faster lookups and less load, but changes take longer to reach users. Short TTLs make changes spread quickly but cause more lookups.",
      ],
    },
    {
      heading: "DNS in system design",
      paragraphs: [
        "DNS is often the first layer of traffic management. Geo-DNS returns different addresses based on where the user is, sending them to the nearest region. Weighted DNS can split traffic between data centres, and health-checked DNS can stop handing out the address of a failed region. Because of caching, DNS failover is never instant: plan for clients that keep using old answers until the TTL expires.",
      ],
    },
  ],
};

export default lesson;
