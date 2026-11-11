import playlists from "../src/data/playlists.json";

async function main() {
  console.log("=== Testing YouTube Thumbnails for All 20 Playlists ===");
  for (const p of playlists) {
    const video = p.sections?.[0]?.videos?.[0];
    const vid = video?.youtubeId;
    if (!vid) {
      console.log(`[${p.slug}] No video ID!`);
      continue;
    }
    const urls = [
      `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
    ];
    let workingUrl: string | null = null;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          workingUrl = url;
          break;
        }
      } catch (e) {}
    }
    console.log(`[${p.slug}] vid: ${vid} -> ${workingUrl ? "OK: " + workingUrl : "FAILED"}`);
  }
}
main();

