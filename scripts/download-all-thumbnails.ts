import fs from "node:fs";
import path from "node:path";

interface ImageTarget {
  category: "sheet" | "playlist";
  slug: string;
  videoIds: string[];
  title: string;
}

const targets: ImageTarget[] = [
  // DSA Sheets
  {
    category: "sheet",
    slug: "striver-a2z-dsa-sheet",
    videoIds: ["EAR7De6Goz4"],
    title: "Striver's A2Z DSA Sheet",
  },
  {
    category: "sheet",
    slug: "love-babbar-dsa-sheet",
    videoIds: ["WQoB2z67hvY"],
    title: "Love Babbar DSA Sheet",
  },
  {
    category: "sheet",
    slug: "shraddha-khapra-dsa-sheet",
    videoIds: ["VTLCoHnyACE"],
    title: "Shradha Khapra DSA Sheet",
  },
  {
    category: "sheet",
    slug: "rohit-negi-dsa-sheet",
    videoIds: ["y3OOaXrFy-Q"],
    title: "Rohit Negi (Coder Army) Sheet",
  },
  {
    category: "sheet",
    slug: "arsh-goyal-dsa-sheet",
    videoIds: ["0nc8gzpkkSY"],
    title: "Arsh Goyal DSA Sheet",
  },
  {
    category: "sheet",
    slug: "neetcode-dsa-sheet",
    videoIds: ["3OamzN90kPg"],
    title: "NeetCode DSA Sheet",
  },
  {
    category: "sheet",
    slug: "20-essential-dsa-patterns",
    videoIds: ["KLlXCFG5TnA", "3OamzN90kPg"],
    title: "20 Essential DSA Patterns",
  },
  {
    category: "sheet",
    slug: "fraz-dsa-sheet",
    videoIds: ["nqowUJzG-iM"],
    title: "Fraz SDE Sheet",
  },
  {
    category: "sheet",
    slug: "blind-75-dsa-sheet",
    videoIds: ["KLlXCFG5TnA"],
    title: "Blind 75 Sheet",
  },

  // Playlists
  {
    category: "playlist",
    slug: "fraz-dsa-playlist",
    videoIds: ["nqowUJzG-iM"],
    title: "Mohammad Fraz SDE Sheet & DSA Playlist",
  },
  {
    category: "playlist",
    slug: "kunal-kushwaha-dsa-bootcamp",
    videoIds: ["wn49bJOYAZM"],
    title: "Kunal Kushwaha Java + DSA Bootcamp",
  },
  {
    category: "playlist",
    slug: "neetcode-roadmap-playlist",
    videoIds: ["3OamzN90kPg"],
    title: "NeetCode DSA Roadmap Playlist",
  },
  {
    category: "playlist",
    slug: "striver-a2z-dsa-playlist",
    videoIds: ["EAR7De6Goz4"],
    title: "Striver A2Z DSA Course Playlist",
  },
  {
    category: "playlist",
    slug: "love-babbar-dsa-playlist",
    videoIds: ["WQoB2z67hvY"],
    title: "Love Babbar DSA Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "shradha-khapra-dsa-playlist",
    videoIds: ["VTLCoHnyACE"],
    title: "Shradha Khapra DSA Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "rohit-negi-dsa-playlist",
    videoIds: ["y3OOaXrFy-Q"],
    title: "Rohit Negi DSA Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "love-babbar-dbms-playlist",
    videoIds: ["eYpXCdvKwEQ"],
    title: "Love Babbar Dbms Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "riti-kumari-dbms-playlist",
    videoIds: ["eylFMNSJCQo"],
    title: "Riti Kumari Dbms Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "love-babbar-os-playlist",
    videoIds: ["_TpOHMCODXo"],
    title: "Love Babbar OS Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "neso-academy-os-playlist",
    videoIds: ["vBURTt97EkA"],
    title: "Neso Academy OS Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "riti-kumari-os-playlist",
    videoIds: ["Q_OU-aKC_Gk"],
    title: "Riti Kumari OS Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "code-with-harry-oops-playlist",
    videoIds: ["nGJTWaaFdjc"],
    title: "Code With Harry OOP Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "rohit-negi-oops-playlist",
    videoIds: ["iw1Xf_33YM0"],
    title: "Rohit Negi OOP Interview Preparation Playlist",
  },
  {
    category: "playlist",
    slug: "hello-interview-system-design-playlist",
    videoIds: ["fhdPyoO6aXI"],
    title: "Hello Interview System Design Walkthroughs",
  },
  {
    category: "playlist",
    slug: "exponent-system-design-playlist",
    videoIds: ["cL9If4X7aaE"],
    title: "Exponent HLD System Design Interview Preparation",
  },
  {
    category: "playlist",
    slug: "code-with-aryan-system-design-playlist",
    videoIds: ["xMNSTBGoGbU"],
    title: "codeWithAryan Low Level Design + MultiThreading",
  },
  {
    category: "playlist",
    slug: "gaurav-sen-system-design-playlist",
    videoIds: ["SqcXvc3ZmRU"],
    title: "Gaurav Sen HLD System Design Interview Preparation",
  },
  {
    category: "playlist",
    slug: "coder-army-system-design-playlist",
    videoIds: ["AK0hu0Zxua4"],
    title: "Code Army LLD System Design Interview Preparation",
  },
  {
    category: "playlist",
    slug: "engineering-digest-system-design-playlist",
    videoIds: ["43-X22tdxiI"],
    title: "Engineering Digest HLD System Design Interview Preparation",
  },
];

async function main() {
  console.log("=== Downloading Authentic Thumbnails Locally ===");

  const baseDir = path.join(process.cwd(), "public", "thumbnails");
  const sheetsDir = path.join(baseDir, "dsa-sheets");
  const playlistsDir = path.join(baseDir, "dsa-playlists");

  fs.mkdirSync(sheetsDir, { recursive: true });
  fs.mkdirSync(playlistsDir, { recursive: true });

  let successCount = 0;
  let failCount = 0;

  for (const t of targets) {
    const targetFolder = t.category === "sheet" ? sheetsDir : playlistsDir;
    const destFile = path.join(targetFolder, `${t.slug}.jpg`);

    let downloaded = false;
    for (const vid of t.videoIds) {
      const urls = [
        `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
      ];
      for (const u of urls) {
        try {
          const res = await fetch(u);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length > 2000) {
              fs.writeFileSync(destFile, buf);
              console.log(`✓ [${t.category}] ${t.title} -> saved ${t.slug}.jpg (${(buf.length / 1024).toFixed(1)} KB)`);
              downloaded = true;
              break;
            }
          }
        } catch (e) {}
      }
      if (downloaded) break;
    }

    if (downloaded) {
      successCount++;
    } else {
      console.error(`✗ [${t.category}] ${t.title} FAILED to download thumbnail`);
      failCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total Downloaded: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

