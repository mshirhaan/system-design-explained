import type { LessonContent } from "@/components/scene/types";

const lesson: LessonContent = {
  slug: "dns-from-the-inside",
  intro:
    "Your laptop asks one question: where is shop.example.com? Behind that simple question, a resolver walks a chain of servers, from the root of the internet down to the domain's own name server, then remembers the answer so the next lookup is almost instant.",
  learn: [
    "What a DNS resolver does on your behalf",
    "The chain of servers: root, top-level domain and authoritative",
    "What a TTL is, and why answers are cached",
    "Why the second lookup costs about 1 ms instead of 70 ms",
    "Why DNS changes take time to reach everyone, and how to plan for it",
  ],
  keyIdea:
    "DNS is a distributed, cached phone book. No single server knows every name: each level only knows who to ask next. Caching at every level is what makes it fast enough to use on every page load.",
  terms: [
    { term: "DNS", meaning: "Domain Name System: the service that turns names like shop.example.com into IP addresses." },
    { term: "Resolver", meaning: "The server that does the lookup work for you, asking other DNS servers until it finds the answer." },
    { term: "Root server", meaning: "The top of the DNS tree; it knows which servers handle each ending such as .com or .org." },
    { term: "TLD server", meaning: "A top-level domain server, such as the .com servers, which knows who runs each .com domain." },
    { term: "Authoritative server", meaning: "The name server the domain's owner controls; it holds the real records for that domain." },
    { term: "Record", meaning: "One entry in DNS, such as an A record that maps a name to an IPv4 address." },
    { term: "TTL", meaning: "Time to live: how many seconds an answer may be cached before asking again." },
    { term: "Cache", meaning: "A short-term memory of recent answers, so repeated questions are answered instantly." },
  ],
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
      lapLabel: [-330, 40],
      resLabel: [-200, -58],
      rootLabel: [40, -205],
      tldLabel: [290, -115],
      authLabel: [320, 280],
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
        "Your browser needs the IP address of shop.example.com. It doesn't search the internet itself. It sends one short question to a DNS resolver, a server whose whole job is to find answers to these questions. The resolver is usually run by your internet provider, or by a public service such as Cloudflare (1.1.1.1) or Google (8.8.8.8).",
      links: [{ from: "lap", to: "res", style: "dashed" }],
      packets: [{ path: ["lap", "res"], kind: "request", at: 0.4, dur: 1.1, tag: "shop.example.com?" }],
      labels: [{ at: "lapLabel", text: "where is shop.example.com?", icon: "search", from: 0.2 }],
      timing: { done: [], active: "ask" },
    },
    {
      title: "First, check the cache",
      body:
        "The resolver first checks its cache, its short-term memory of answers it found recently. A popular resolver serves millions of people, so names like google.com are almost always there already. Our shop is small and nobody has asked about it recently, so this time the cache has nothing. The resolver will have to find out.",
      focus: ["resolver"],
      labels: [
        { at: "resLabel", text: "not in my cache", icon: "search", tone: "muted", from: 0.4 },
      ],
      timing: { done: [], active: "ask" },
      hold: 2.6,
    },
    {
      title: "Start at the root",
      body:
        "DNS is organised like a tree, read from right to left: first .com, then example.com, then shop.example.com. The resolver starts at the top of the tree with a root server. Root servers don't know any website's address, but they know who runs every ending like .com, .org or .uk. The root's answer: \"I don't know, but ask the .com servers\".",
      links: [{ from: "res2", to: "root", both: true }],
      packets: [
        { path: ["res2", "root"], kind: "request", at: 0.3, dur: 1.1, tag: "where is .com?" },
        { path: ["root", "res2"], kind: "response", at: 1.7, dur: 1.1, tag: "ask the .com servers" },
      ],
      labels: [{ at: "rootLabel", text: "13 root server names worldwide", icon: "globe", from: 0.2 }],
      timing: { done: ["ask"], active: "root" },
    },
    {
      title: "Ask the .com servers",
      body:
        "Next the resolver asks the .com servers, known as top-level domain (TLD) servers. They don't know shop.example.com's address either. What they do know is which name server is in charge of example.com, because the owner registered that when they bought the domain. So they point the resolver there.",
      links: [{ from: "res2", to: "tld", both: true }],
      packets: [
        { path: ["res2", "tld"], kind: "request", at: 0.3, dur: 1.2, tag: "where is example.com?" },
        { path: ["tld", "res2"], kind: "response", at: 1.8, dur: 1.2, tag: "ask example.com's server" },
      ],
      labels: [{ at: "tldLabel", text: "I know who runs it", icon: "search", tone: "green", from: 1.4 }],
      timing: { done: ["ask", "root"], active: "tld" },
    },
    {
      title: "The authoritative answer",
      body:
        "Finally the resolver reaches the authoritative name server for example.com, the one the domain's owner controls, often through a DNS provider like Cloudflare or Amazon Route 53. It holds the real record: shop.example.com is at 93.184.216.34. The answer comes with a TTL (time to live) of 300 seconds, meaning \"you may reuse this for 5 minutes\".",
      links: [{ from: "res2", to: "auth", both: true }],
      packets: [
        { path: ["res2", "auth"], kind: "request", at: 0.3, dur: 1.2, tag: "shop.example.com?" },
        { path: ["auth", "res2"], kind: "response", at: 1.8, dur: 1.2, tag: "93.184.216.34, TTL 300" },
      ],
      labels: [{ at: "authLabel", text: "the record: 93.184.216.34", icon: "key", tone: "orange", from: 1.4 }],
      timing: { done: ["ask", "root", "tld"], active: "auth" },
    },
    {
      title: "Answer, and remember it",
      body:
        "The resolver passes the address back to your laptop and saves it in its cache for the next 5 minutes. Your laptop's operating system and your browser save their own copies too. The whole chain took about 70 milliseconds, roughly three round trips to servers around the world plus the hop to the resolver.",
      focus: ["resolver"],
      links: [{ from: "res", to: "lap" }],
      packets: [{ path: ["res", "lap"], kind: "response", at: 0.3, dur: 1.1, tag: "93.184.216.34" }],
      labels: [
        { at: "resLabel", text: "saved for 5 minutes", icon: "clock", tone: "violet", from: 0.2 },
        { at: "lapLabel", text: "got the address in 70 ms", icon: "check", tone: "green", from: 1.5 },
      ],
      timing: { done: ["ask", "root", "tld", "auth", "answer"] },
    },
    {
      title: "The next lookup is nearly free",
      body:
        "A minute later, someone else using the same resolver looks up shop.example.com. This time the answer is in the cache, so the resolver replies straight away in about 1 ms. No root, no .com and no authoritative server is involved. Most DNS lookups on the internet are answered from a cache like this.",
      note: "Caching is why DNS can serve the entire internet: the root servers only see a tiny fraction of all lookups.",
      links: [{ from: "lap", to: "res", both: true }],
      packets: [
        { path: ["lap", "res"], kind: "request", at: 0.3, dur: 0.8, tag: "shop.example.com?" },
        { path: ["res", "lap"], kind: "response", at: 1.2, dur: 0.8, tag: "93.184.216.34" },
      ],
      labels: [{ at: "resLabel", text: "answered from cache in 1 ms", icon: "bolt", tone: "green", from: 1 }],
    },
    {
      title: "When the TTL runs out",
      body:
        "After 5 minutes the saved answer expires, and the next lookup walks the chain again. This is why changing a DNS record, for example when moving your site to a new server, takes time to reach everyone. Old answers live on in caches all over the world until their TTL ends, so some users keep reaching the old server for a while.",
      note: "Planning a server move? Lower the TTL to 60 seconds a day ahead, so the change spreads quickly when you make it, then raise it again.",
      labels: [
        { at: "resLabel", text: "5 minutes passed, ask again", icon: "clock", tone: "orange", from: 0.3 },
        { at: "authLabel", text: "new address? caches catch up later", icon: "key", tone: "muted", from: 1.2 },
      ],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "Which server actually holds the record for shop.example.com?",
      options: ["A root server", "The .com server", "The authoritative name server for example.com", "Your laptop"],
      answer: 2,
      explain: "Root and .com servers only point the way. The authoritative server, controlled by the domain's owner, holds the real records.",
    },
    {
      q: "What does a TTL of 300 on a DNS answer mean?",
      options: ["The site has 300 servers", "The answer may be cached for 300 seconds", "The lookup took 300 ms", "The record expires after 300 visits"],
      answer: 1,
      explain: "TTL means time to live: how long resolvers and devices may reuse the answer before asking again.",
    },
    {
      q: "Why is the second lookup of the same name usually so fast?",
      options: ["The root server remembers you", "The resolver answers from its cache without asking any other server", "DNS skips encryption", "The browser guesses the address"],
      answer: 1,
      explain: "While the TTL lasts, the resolver (and your device) can answer from memory in about a millisecond.",
    },
    {
      q: "You moved your site to a new IP address an hour ago, but some users still reach the old server. Why?",
      options: ["DNS is broken", "Their resolvers still have the old answer cached until its TTL expires", "The root server rejected the change", "Browsers never update DNS"],
      answer: 1,
      explain: "Caches hold the old record until the TTL runs out. If the TTL was a day, some users may see the old address for up to a day.",
    },
    {
      q: "Your company plans to switch to a new server next Tuesday. What should you do with the DNS TTL?",
      options: ["Raise it to a week", "Lower it a day or two before the switch, then raise it again afterwards", "Delete the record", "Nothing: TTL doesn't matter"],
      answer: 1,
      explain: "A short TTL before the change means caches refresh quickly, so users move to the new server within minutes. Afterwards, a longer TTL reduces lookups again.",
    },
  ],
  article: [
    {
      heading: "What is DNS?",
      paragraphs: [
        "The Domain Name System (DNS) translates human-friendly names like shop.example.com into IP addresses like 93.184.216.34 that computers use to connect. It's often called the internet's phone book, but it's really a distributed phone book: no single server holds every entry. Instead, responsibility is split across a tree of servers, and answers are cached everywhere along the way.",
      ],
    },
    {
      heading: "How a lookup works, step by step",
      paragraphs: [
        "When you visit a site, your device asks a recursive resolver for the address. If the resolver doesn't have it cached, it walks the DNS tree from the top. It asks a root server, which replies with the servers for the top-level domain (.com, .org, .io and so on). It asks a TLD server, which replies with the authoritative name servers for the domain. It asks the authoritative server, which returns the actual record. The resolver then passes the answer back to you and caches it.",
        "Your device does very little of this work itself; it makes one request and waits. The resolver does the walking, which is why it's called recursive.",
      ],
    },
    {
      heading: "Root, TLD and authoritative servers",
      paragraphs: [
        "There are 13 named root server identities, run by different organisations, but each is copied to many locations worldwide (over 1,500 in total) using anycast, which lets many machines share one address and routes you to the nearest. TLD servers are run by registries, such as Verisign for .com. Authoritative servers are run by whoever manages the domain, often a DNS provider like Cloudflare, Amazon Route 53 or Google Cloud DNS.",
        "Common record types include A (an IPv4 address), AAAA (an IPv6 address), CNAME (an alias pointing to another name), MX (which servers receive email for the domain) and TXT (free-form text, often used to prove domain ownership).",
      ],
    },
    {
      heading: "Worked example: a cold lookup versus a cached one",
      paragraphs: [
        "Cold lookup from Europe for a .com site whose DNS is hosted in the US: laptop to resolver 2 ms, resolver to root 20 ms (nearby copy), resolver to .com server 20 ms, resolver to the authoritative server 25 ms, answer back 2 ms. Total: about 70 ms before your browser can even start connecting.",
        "Cached lookup a minute later: laptop to resolver and back, 1–2 ms. If your own computer still has the answer cached, 0 ms: no network at all. That difference, 70 ms versus nearly nothing, is why DNS caching matters so much for page speed.",
      ],
    },
    {
      heading: "Caching happens at every level",
      paragraphs: [
        "Resolvers don't only cache final answers; they cache the referrals too. Once a resolver has learned where the .com servers are, it remembers that for days, so it almost never needs to ask a root server about .com again. Likewise, once it knows which servers are authoritative for example.com, a lookup of www.example.com or api.example.com can go straight there.",
        "In practice, a busy resolver's lookups rarely start at the root. The full walk you saw in the animation happens mainly for unpopular names, or right after a cache entry expires. There are also caches in your browser, your operating system and sometimes your home router, so a single page often triggers no outside DNS traffic at all.",
        "Negative answers are cached too: if a name doesn't exist, resolvers remember that for a while, which protects the authoritative servers from repeated lookups of misspelled names.",
      ],
    },
    {
      heading: "TTL: the trade-off between speed and freshness",
      paragraphs: [
        "Every record has a TTL chosen by the domain owner. Long TTLs, such as a day, mean fewer lookups and faster browsing, but changes take up to a day to reach everyone. Short TTLs, such as 60 seconds, let changes spread quickly but cause many more lookups and slightly slower first visits.",
        "Typical choices: a few minutes for records that might change during an incident, and hours or days for records that rarely change, like mail servers.",
      ],
    },
    {
      heading: "Common mistakes and misconceptions",
      paragraphs: [
        "\"DNS changes are instant.\" They aren't; they're limited by cached TTLs, and some resolvers hold answers longer than they should. \"DNS failover will instantly move users.\" Clients keep using cached answers, so failover through DNS takes at least the TTL. \"DNS is only looked up once per site.\" Pages often load files from several domains (a CDN, fonts, analytics), each needing its own lookup. \"DNS is private.\" Traditional DNS queries are unencrypted; newer DNS over HTTPS (DoH) fixes that.",
      ],
    },
    {
      heading: "DNS in real systems",
      paragraphs: [
        "DNS is often the first layer of traffic management. Geo-DNS returns different addresses based on where the user is, sending them to the nearest data centre. Weighted DNS splits traffic, for example 90% to the current version and 10% to a new one. Health-checked DNS stops handing out the address of a failed region. CDNs like Cloudflare and Akamai rely on DNS to send each user to a nearby edge server.",
        "DNS outages are dramatic: when a major DNS provider fails, thousands of sites become unreachable even though their servers are fine, because nobody can find their addresses.",
      ],
    },
    {
      heading: "In a system design interview",
      paragraphs: [
        "When you sketch how users reach your system, start with DNS. Mention that it can route users to the nearest region (geo-DNS) and remove a failed region, but that failover is limited by TTLs and client caching, so you'd keep TTLs short (say 60 seconds) for records you might need to change in an emergency. If the interviewer asks how a global service sends users to the closest data centre, DNS and anycast are the expected answers.",
      ],
    },
  ],
};

export default lesson;
