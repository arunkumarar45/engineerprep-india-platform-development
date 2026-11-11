import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db";
import { sql } from "drizzle-orm";
import playlistsJson from "../src/data/playlists.json";

async function main() {
  console.log("=== Migrating Schema for DSA Sheets & Playlists Thumbnails ===");

  // 1. Add columns to dsa_sheets if not exist
  await db.execute(sql`
    ALTER TABLE dsa_sheets
    ADD COLUMN IF NOT EXISTS thumbnail_url text,
    ADD COLUMN IF NOT EXISTS thumbnail_source varchar(120),
    ADD COLUMN IF NOT EXISTS thumbnail_source_url text,
    ADD COLUMN IF NOT EXISTS thumbnail_alt varchar(240),
    ADD COLUMN IF NOT EXISTS thumbnail_status varchar(40) DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
  `);
  console.log("dsa_sheets columns updated!");

  // 2. Create playlists table if not exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS playlists (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug varchar(120) NOT NULL UNIQUE,
      title varchar(240) NOT NULL,
      category varchar(60) NOT NULL DEFAULT 'dsa',
      instructor varchar(160),
      channel varchar(160),
      total_videos integer NOT NULL DEFAULT 0,
      total_duration varchar(60),
      rating numeric(3, 1) DEFAULT 4.8,
      badge varchar(120),
      description text,
      playlist_url text NOT NULL,
      thumbnail_url text NOT NULL,
      thumbnail_source varchar(120),
      thumbnail_source_url text,
      thumbnail_alt varchar(240),
      thumbnail_status varchar(40) NOT NULL DEFAULT 'ACTIVE',
      order_index integer NOT NULL DEFAULT 0,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS playlists_slug_idx ON playlists (slug);
    CREATE INDEX IF NOT EXISTS playlists_category_idx ON playlists (category);
  `);
  console.log("playlists table created / verified!");

  // 3. Update dsa_sheets with authentic individual thumbnails
  const sheetThumbnails = [
    {
      slug: "striver-a2z-dsa-sheet",
      thumbnailUrl: "/thumbnails/dsa-sheets/striver-a2z-dsa-sheet.jpg",
      source: "YouTube / takeUforward",
      sourceUrl: "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_st8",
      alt: "Striver A2Z DSA Sheet by Raj Vikramaditya",
    },
    {
      slug: "love-babbar-dsa-sheet",
      thumbnailUrl: "/thumbnails/dsa-sheets/love-babbar-dsa-sheet.jpg",
      source: "YouTube / CodeHelp by Babbar",
      sourceUrl: "https://www.youtube.com/playlist?list=PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA",
      alt: "Love Babbar Complete DSA Placement Sheet",
    },
    {
      slug: "shraddha-khapra-dsa-sheet",
      thumbnailUrl: "/thumbnails/dsa-sheets/shraddha-khapra-dsa-sheet.jpg",
      source: "YouTube / Apna College",
      sourceUrl: "https://www.youtube.com/playlist?list=PLfqMhTWNBTe3LtFWcvWPqTkUSlB32kJop",
      alt: "Shradha Khapra DSA Placement Sheet (Apna College)",
    },
    {
      slug: "rohit-negi-dsa-sheet",
      thumbnailUrl: "/thumbnails/dsa-sheets/rohit-negi-dsa-sheet.jpg",
      source: "YouTube / Coder Army",
      sourceUrl: "https://www.youtube.com/playlist?list=PLQEaRBV9gAFu4ovJ41PywklEEbOXGyxvm",
      alt: "Rohit Negi Coder Army DSA Sheet",
    },
    {
      slug: "arsh-goyal-dsa-sheet",
      thumbnailUrl: "/thumbnails/dsa-sheets/arsh-goyal-dsa-sheet.jpg",
      source: "YouTube / Arsh Goyal",
      sourceUrl: "https://www.youtube.com/watch?v=0nc8gzpkkSY",
      alt: "Arsh Goyal 6 Companies 30 Days DSA Sheet",
    },
    {
      slug: "neetcode-dsa-sheet",
      thumbnailUrl: "/thumbnails/dsa-sheets/neetcode-dsa-sheet.jpg",
      source: "YouTube / NeetCode",
      sourceUrl: "https://www.youtube.com/playlist?list=PLot-Xpze53ldVwtstag2TL4HQhLS48kBf",
      alt: "NeetCode 150 Core DSA Sheet",
    },
    {
      slug: "20-essential-dsa-patterns",
      thumbnailUrl: "/thumbnails/dsa-sheets/20-essential-dsa-patterns.jpg",
      source: "MAANG Algorithmic Patterns",
      sourceUrl: "https://www.youtube.com/playlist?list=PLot-Xpze53ldVwtstag2TL4HQhAnC8ATf",
      alt: "20 Essential Visual DSA Patterns",
    },
  ];

  for (const st of sheetThumbnails) {
    const res = await db.execute(sql`
      UPDATE dsa_sheets
      SET thumbnail_url = ${st.thumbnailUrl},
          cover_image_url = ${st.thumbnailUrl},
          thumbnail_source = ${st.source},
          thumbnail_source_url = ${st.sourceUrl},
          thumbnail_alt = ${st.alt},
          thumbnail_status = 'ACTIVE',
          updated_at = now()
      WHERE slug = ${st.slug};
    `);
    console.log(`  [Sheet Thumb Linked] ${st.slug} -> ${st.thumbnailUrl} (${res.rowCount} rows)`);
  }

  // 4. Update / Seed Playlists table & JSON
  console.log("\n=== Seeding Playlists Table ===");
  const updatedJson: any[] = [];

  for (let i = 0; i < playlistsJson.length; i++) {
    const p = playlistsJson[i];
    const thumbUrl = `/thumbnails/dsa-playlists/${p.slug}.jpg`;
    const source = `YouTube / ${p.channel || p.instructor}`;

    await db.execute(sql`
      INSERT INTO playlists (
        slug, title, category, instructor, channel, total_videos, total_duration,
        rating, badge, description, playlist_url, thumbnail_url, thumbnail_source,
        thumbnail_source_url, thumbnail_alt, thumbnail_status, order_index, updated_at
      )
      VALUES (
        ${p.slug}, ${p.title}, ${p.category}, ${p.instructor}, ${p.channel},
        ${p.totalVideos}, ${p.totalDuration}, ${p.rating}, ${p.badge}, ${p.description},
        ${p.playlistUrl}, ${thumbUrl}, ${source}, ${p.playlistUrl},
        ${`${p.title} by ${p.instructor}`}, 'ACTIVE', ${i}, now()
      )
      ON CONFLICT (slug) DO UPDATE
      SET thumbnail_url = ${thumbUrl},
          thumbnail_source = ${source},
          thumbnail_source_url = ${p.playlistUrl},
          thumbnail_alt = ${`${p.title} by ${p.instructor}`},
          thumbnail_status = 'ACTIVE',
          updated_at = now();
    `);

    console.log(`  [Playlist Thumb Linked] ${p.slug} -> ${thumbUrl}`);

    // Update JSON copy too
    updatedJson.push({
      ...p,
      thumbnailUrl: thumbUrl,
      thumbnailSource: source,
      thumbnailAlt: `${p.title} by ${p.instructor}`,
      thumbnailStatus: "ACTIVE",
    });
  }

  // Write updated playlists.json
  const jsonPath = path.join(process.cwd(), "src", "data", "playlists.json");
  fs.writeFileSync(jsonPath, JSON.stringify(updatedJson, null, 2));
  console.log("\nUpdated src/data/playlists.json with thumbnail fields!");

  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

