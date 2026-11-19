import type { LessonContent } from "@/components/scene/types";

const top = ["lap", "r2", "r4", "srv"];
const bottom = ["lap", "r1", "r3", "srv"];
const allRoutes = [
  { from: "lap", to: "r1", style: "muted" as const },
  { from: "r1", to: "r3", style: "muted" as const },
  { from: "r3", to: "srv", style: "muted" as const },
  { from: "lap", to: "r2", style: "muted" as const },
  { from: "r2", to: "r4", style: "muted" as const },
  { from: "r4", to: "srv", style: "muted" as const },
];
const fourPackets = [
  { path: bottom, kind: "message" as const, at: 0.2, dur: 2.6, tag: "#1" },
  { path: top, kind: "message" as const, at: 0.5, dur: 1.8, tag: "#2" },
  { path: bottom, kind: "message" as const, at: 0.8, dur: 2.6, tag: "#3" },
  { path: top, kind: "message" as const, at: 1.1, dur: 1.8, tag: "#4" },
];

const lesson: LessonContent = {
  slug: "ip-addresses-ports-and-packets",
  intro:
    "How does a photo get from your laptop to a server on the other side of the world? It's chopped into small packets, each stamped with addresses, and every packet finds its own way there. Watch them split up, scatter across routers and get put back together in the right order.",
  learn: [
    "What an IP address is and why every device needs one",
    "Why data travels as many small packets instead of one big piece",
    "What's written on each packet, and how routers use it",
    "Why packets can arrive out of order, and how the receiver fixes that",
    "What ports are, and how one server runs many programs",
  ],
  keyIdea:
    "The internet moves small, addressed packets, not whole files. Routers forward each packet on its own, one hop at a time, and the receiver puts them back together. An IP address finds the machine; a port finds the program on that machine.",
  terms: [
    { term: "IP address", meaning: "A number that identifies a device on the internet, like 93.184.216.34." },
    { term: "Packet", meaning: "A small piece of data, usually up to about 1,500 bytes, sent across the network on its own." },
    { term: "Header", meaning: "The label at the front of each packet: who it's from, who it's for, and its position in the sequence." },
    { term: "Router", meaning: "A device that receives packets and passes each one to the next device closer to its destination." },
    { term: "Hop", meaning: "One step from one router to the next. A packet often makes 10–20 hops." },
    { term: "Port", meaning: "A number from 0 to 65,535 that picks which program on a machine gets the packet." },
    { term: "Socket", meaning: "An IP address plus a port, like 93.184.216.34:443: one end of a conversation." },
  ],
  scene: {
    viewBox: [-500, -235, 1000, 570],
    entities: [
      { id: "desk", kind: "slab", at: [-360, 222], w: 110, h: 14, name: "your laptop", nameIcon: "user" },
      { id: "laptop", kind: "laptop", at: [-360, 208] },
      { id: "r2", kind: "router", at: [-150, -10], name: "router" },
      { id: "r4", kind: "router", at: [80, -40], name: "router" },
      { id: "r1", kind: "router", at: [-140, 170], name: "router" },
      { id: "r3", kind: "router", at: [60, 190], name: "router" },
      { id: "server", kind: "box", at: [300, 70], w: 80, h: 100, color: "blue", text: ["Server"], textSize: 18, name: "93.184.216.34" },
    ],
    points: {
      lap: [-278, 160],
      r1: [-140, 152],
      r2: [-150, -28],
      r3: [60, 172],
      r4: [80, -58],
      srv: [236, 40],
      lapLabel: [-350, 40],
      lapLabel2: [-330, -10],
      srvLabel: [300, -140],
      tokens: [-330, 66],
      buf: [240, -90],
      netLabel: [-40, 80],
      port443: [300, -190],
      port22: [300, -145],
    },
  },
  steps: [
    {
      title: "Every device has an address",
      body:
        "Every device on the internet has an IP address, a number that works like a street address for computers. Your laptop has one, and so does the server you want to reach. Today's common format, IPv4, looks like four numbers from 0 to 255 separated by dots, such as 93.184.216.34. Without an address, nothing could be delivered.",
      focus: ["laptop", "server"],
      labels: [
        { at: "lapLabel", text: "my address: 203.0.113.7", icon: "user", from: 0.3 },
        { at: "srvLabel", text: "server: 93.184.216.34", icon: "globe", from: 0.9 },
      ],
      hold: 2.4,
    },
    {
      title: "Big messages are split into packets",
      body:
        "You upload a photo of 6,000 bytes. The network doesn't send it as one block. It's chopped into packets, each up to about 1,500 bytes, so this photo becomes 4 packets. Small packets let millions of conversations share the same cables fairly, and if one goes missing, only that small piece needs resending.",
      tokens: [
        { at: "tokens", gap: [26, 0], items: [1, 2, 3, 4].map((n, i) => ({ kind: "message" as const, tag: `#${n}`, from: 0.4 + i * 0.35 })) },
      ],
      labels: [{ at: "lapLabel2", text: "one photo becomes 4 packets", icon: "page", tone: "yellow", from: 0.2 }],
    },
    {
      title: "Each packet carries a label",
      body:
        "Every packet starts with a header, a small label like the front of an envelope. It says where the packet came from (203.0.113.7), where it's going (93.184.216.34) and its position in the sequence (#1 to #4). The rest of the packet is a slice of the photo. Routers only ever read the header; they don't care what's inside.",
      tokens: [
        { at: "tokens", gap: [26, 0], items: [1, 2, 3, 4].map((n) => ({ kind: "message" as const, tag: `#${n}` })) },
      ],
      labels: [
        { at: "lapLabel2", text: "from 203.0.113.7", icon: "user", from: 0.3 },
        { at: "netLabel", text: "to 93.184.216.34, piece 1 of 4", icon: "globe", tone: "yellow", from: 1 },
      ],
      hold: 2.6,
    },
    {
      title: "Routers pass packets along, hop by hop",
      body:
        "Packets travel through routers, the post offices of the internet. Each router reads the destination address, picks the neighbouring router that's closer to it, and passes the packet on. That single move is called a hop. A packet to a distant server typically makes 10 to 20 hops, each taking from under a millisecond to tens of milliseconds.",
      links: [
        { from: "lap", to: "r1", style: "muted" },
        { from: "r1", to: "r3", style: "muted" },
        { from: "r3", to: "srv", style: "muted" },
      ],
      packets: [{ path: bottom, kind: "message", at: 0.3, dur: 2.8, tag: "#1" }],
      labels: [{ at: "netLabel", text: "each router picks the next hop", icon: "globe", tone: "muted", from: 0.2 }],
    },
    {
      title: "Packets can take different routes",
      body:
        "There's no fixed route. Each router decides on its own, based on traffic at that moment, so packets from the same photo can take different paths. Here #1 and #3 take the lower path through a busy router, while #2 and #4 take the faster upper path. This flexibility is what lets the internet route around broken or congested links.",
      links: allRoutes,
      packets: fourPackets,
      labels: [{ at: "netLabel", text: "no fixed route for any packet", icon: "globe", tone: "muted", from: 0.2 }],
    },
    {
      title: "Reassembled in the right order",
      body:
        "Because routes differ, packets arrive out of order: #2 lands first, then #1, #4 and #3. The receiving computer holds them in a waiting area called a buffer and uses the sequence numbers to slot each piece into place. Only when all 4 are present does it hand the complete photo to the program. If one never arrives, it asks for that piece again.",
      links: allRoutes,
      packets: fourPackets,
      tokens: [
        {
          at: "buf",
          gap: [26, 0],
          items: [
            { kind: "message", tag: "1", from: 2.8 },
            { kind: "message", tag: "2", from: 2.3 },
            { kind: "message", tag: "3", from: 3.4 },
            { kind: "message", tag: "4", from: 2.9 },
          ],
        },
      ],
      labels: [{ at: "srvLabel", text: "photo complete", icon: "check", tone: "green", from: 3.8 }],
    },
    {
      title: "Ports pick the program",
      body:
        "One server runs many programs at once: a web server, a remote-login service, maybe a database. The IP address only gets a packet to the right machine. A second number, the port, picks the program. Web traffic uses port 443, remote login uses port 22, and a PostgreSQL database uses 5432. Think of the IP address as a building and the port as a flat number.",
      links: [
        { from: "lap", to: "r2", style: "muted" },
        { from: "r2", to: "r4", style: "muted" },
        { from: "r4", to: "srv", style: "muted" },
      ],
      packets: [{ path: top, kind: "request", at: 0.4, dur: 1.8, tag: "to port 443" }],
      labels: [
        { at: "port443", text: "port 443 goes to the web server", icon: "globe", tone: "green", from: 2.2 },
        { at: "port22", text: "port 22 goes to remote login", icon: "key", tone: "muted", from: 0.3 },
      ],
    },
    {
      title: "Address plus port: a socket",
      body:
        "Put the two together, 93.184.216.34:443, and you have a socket: one exact end of a conversation. Your laptop gets a temporary port too, like 51544. Every connection on the internet is identified by the pair of sockets at its two ends, which is how one server can hold thousands of separate conversations on port 443 without mixing them up.",
      focus: ["server"],
      labels: [
        { at: "srvLabel", text: "93.184.216.34:443", icon: "globe", tone: "yellow", from: 0.2, size: 16 },
        { at: "lapLabel", text: "203.0.113.7:51544", icon: "user", tone: "yellow", from: 0.8, size: 16 },
      ],
      links: [{ from: "lap", to: "srv", style: "dashed", both: true }],
      hold: 3,
    },
  ],
  quiz: [
    {
      q: "Why is a large file split into packets?",
      options: [
        "To encrypt it",
        "So it can be sent in small, independently routed pieces and resent piece by piece",
        "Because servers can only store small files",
        "To change its file type",
      ],
      answer: 1,
      explain: "Small packets share links fairly, can take different routes, and only a lost piece needs resending.",
    },
    {
      q: "What does a router look at to decide where to send a packet?",
      options: ["The photo inside the packet", "The destination address in the packet's header", "The sender's name", "The file size"],
      answer: 1,
      explain: "Routers read only the header, mainly the destination IP address, and forward the packet one hop closer.",
    },
    {
      q: "Packets #1 and #2 of the same file took different routes. What can happen?",
      options: ["Nothing, they always arrive in order", "They can arrive out of order", "The file is corrupted forever", "The router merges them"],
      answer: 1,
      explain: "Different routes have different delays. Sequence numbers let the receiver put packets back in order.",
    },
    {
      q: "A server runs a website and a database. A packet arrives for 10.0.0.5:5432. Which program gets it?",
      options: ["The website", "The database, because 5432 is its port", "Both", "Neither: ports are optional"],
      answer: 1,
      explain: "The IP address picks the machine; the port picks the program. PostgreSQL listens on 5432 by default.",
    },
    {
      q: "Why can one web server hold thousands of connections on port 443 without mixing them up?",
      options: [
        "Each user gets a different server",
        "Each connection is identified by both ends: the client's address and port, plus the server's",
        "Port 443 is very large",
        "Connections take turns",
      ],
      answer: 1,
      explain: "A connection is the pair of sockets at its two ends. Clients use different addresses or temporary ports, so every pair is unique.",
    },
  ],
  article: [
    {
      heading: "IP addresses: how machines are found",
      paragraphs: [
        "Every device connected to the internet has an IP address. IPv4 addresses look like 93.184.216.34: four numbers from 0 to 255, giving about 4.3 billion possible addresses. That isn't enough for every phone, laptop and smart fridge, so the newer IPv6 format uses much longer addresses like 2606:2800:220:1::1, with enough room for many addresses per grain of sand on Earth.",
        "Your home network usually shares one public IPv4 address among all your devices. Your router gives each device a private address (like 192.168.1.20) and translates between them, a technique called NAT (network address translation).",
      ],
    },
    {
      heading: "Packets: why data is chopped up",
      paragraphs: [
        "Data crosses the internet in packets, typically up to about 1,500 bytes each. Each packet has a header with the source address, destination address and other bookkeeping, followed by a slice of the actual data, called the payload.",
        "Packets let many conversations share the same cables fairly: a big download can't hog a link, because its packets take turns with everyone else's. They also let routers make quick decisions about each piece. And if one piece is lost or damaged, only that piece needs to be sent again.",
      ],
    },
    {
      heading: "How routing works, step by step",
      paragraphs: [
        "Routers are the post offices of the internet. When a packet arrives, a router looks up the destination address in its routing table, a list of which neighbour is the best next step toward each group of addresses, and forwards it. Routers constantly share information with each other, so their tables reflect broken links and congestion.",
        "Because each packet is routed independently, packets from the same message can take different paths and arrive out of order. Packets also carry a hop limit: each router subtracts one, and a packet that reaches zero is thrown away, so a packet caught in a loop can't circle forever.",
      ],
    },
    {
      heading: "Worked example: sending a 6 KB photo",
      paragraphs: [
        "A 6,000-byte photo becomes 4 packets of about 1,500 bytes. Two go via a congested route that takes 60 ms; two go via a clear route that takes 40 ms. Packet #2 (fast route) arrives at 40 ms, #1 (slow) at 60 ms, #4 at 45 ms, #3 at 65 ms. The receiver buffers them and delivers the complete photo at 65 ms. If #3 had been lost, the receiver's TCP layer would ask for it again, adding at least one more round trip. Notice that the photo is only as fast as its slowest packet: one delayed or lost piece holds up the whole thing, which is a theme you'll see again in the TCP and HTTP lessons.",
      ],
    },
    {
      heading: "Ports and sockets",
      paragraphs: [
        "A single server runs many programs, so an address alone isn't enough. Ports, numbered 0 to 65,535, pick the program: 443 for HTTPS, 80 for HTTP, 22 for SSH remote login, 5432 for PostgreSQL, 6379 for Redis. An address plus a port is a socket. Clients use a temporary port, picked at random, for each outgoing connection.",
        "A connection is identified by four values: the client's address and port and the server's address and port. That's how one server can keep thousands of simultaneous conversations on port 443 separate.",
      ],
    },
    {
      heading: "Trade-offs of sending data in packets",
      paragraphs: [
        "The old telephone network worked differently: a call reserved a dedicated circuit from one end to the other for its whole duration. That gave steady quality, but the circuit sat idle during every pause in the conversation, and if any link broke, the call dropped.",
        "Packet switching, the internet's approach, shares every link between everyone and reroutes around failures automatically. It uses cables far more efficiently and keeps working when parts of the network fail. The price is unpredictability: packets can be delayed, reordered, duplicated or lost when a router is overloaded. The internet itself promises only \"best effort\" delivery, so reliability has to be added on top, mostly by TCP, which the TCP lesson covers in detail.",
        "For you as a system designer, the lesson is simple: the network is fast but imperfect. Any message can be late or lost, so well-designed systems use timeouts, retries and acknowledgements rather than assuming delivery.",
      ],
    },
    {
      heading: "Common misconceptions",
      paragraphs: [
        "\"Data travels along a fixed wire from me to the server.\" In reality, each packet is routed independently and paths change. \"Packets always arrive in order.\" They often don't; the receiver reorders them. \"An IP address identifies a person.\" It identifies a network endpoint, often shared by many devices through NAT, and it can change. \"Ports are physical sockets on the machine.\" They're just numbers the operating system uses to pick a program.",
      ],
    },
    {
      heading: "Where this shows up in real systems",
      paragraphs: [
        "Load balancers listen on port 443 and forward traffic to application servers on internal addresses and ports. Firewalls and cloud security groups are rules about which addresses and ports may talk to each other, for example \"only the app servers may reach the database on port 5432\". Services that must be reachable from anywhere, like DNS resolvers and CDNs, use anycast, a technique where many machines worldwide share one IP address and routers deliver each packet to the nearest one.",
      ],
    },
    {
      heading: "In a system design interview",
      paragraphs: [
        "You rarely need to discuss packets in detail, but these ideas sit under everything. When you draw a load balancer, know that it accepts connections on 443 and forwards them to servers on private addresses. When you talk about latency, remember that every message is made of packets crossing many hops. When you secure a design, mention restricting which machines can reach which ports. It shows you understand what's happening below the boxes and arrows.",
      ],
    },
  ],
};

export default lesson;
