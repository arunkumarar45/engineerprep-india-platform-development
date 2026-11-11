import fs from "node:fs";
import path from "node:path";
import playlists from "../src/data/playlists.json";

console.log(`Total playlists in playlists.json: ${playlists.length}`);
for (const p of playlists) {
  const firstVideo = p.sections?.[0]?.videos?.[0];
  console.log(`- [${p.slug}] "${p.title}" by ${p.instructor} (Cat: ${p.category}, 1st video: ${firstVideo?.youtubeId || "none"}, playlist: ${p.playlistUrl})`);
}

