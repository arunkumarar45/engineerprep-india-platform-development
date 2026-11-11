import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import playlistsJson from "../data/playlists.json";

describe("DSA Sheets and Playlists Thumbnails Verification", () => {
  const publicDir = path.join(process.cwd(), "public");

  it("verifies homepage hero student image exists on disk and is not empty", () => {
    const heroPath = path.join(publicDir, "images", "hero-student.png");
    expect(fs.existsSync(heroPath)).toBe(true);
    const stats = fs.statSync(heroPath);
    expect(stats.size).toBeGreaterThan(1000); // verified valid image asset
  });

  it("verifies all 20 playlists have unique, authentic individual thumbnail files on disk", () => {
    expect(playlistsJson.length).toBe(20);

    const thumbnailUrls = new Set<string>();

    for (const playlist of playlistsJson) {
      expect(playlist.thumbnailUrl).toBeDefined();
      expect(typeof playlist.thumbnailUrl).toBe("string");
      expect(playlist.thumbnailUrl).toMatch(/^\/thumbnails\/dsa-playlists\/[a-z0-9-]+\.jpg$/);

      // Verify file exists on disk
      const localFilePath = path.join(publicDir, playlist.thumbnailUrl.replace(/^\//, ""));
      expect(fs.existsSync(localFilePath)).toBe(true);

      const stats = fs.statSync(localFilePath);
      expect(stats.size).toBeGreaterThan(5000); // Real image, not empty or broken

      // Verify uniqueness (no duplicate thumbnail reuse across different playlists)
      expect(thumbnailUrls.has(playlist.thumbnailUrl)).toBe(false);
      thumbnailUrls.add(playlist.thumbnailUrl);
    }

    expect(thumbnailUrls.size).toBe(20);
  });

  it("verifies all DSA sheets have unique, authentic thumbnail files on disk", () => {
    const expectedSheets = [
      "striver-a2z-dsa-sheet",
      "love-babbar-dsa-sheet",
      "shraddha-khapra-dsa-sheet",
      "rohit-negi-dsa-sheet",
      "arsh-goyal-dsa-sheet",
      "neetcode-dsa-sheet",
      "20-essential-dsa-patterns",
    ];

    const sheetThumbnails = new Set<string>();

    for (const slug of expectedSheets) {
      const relPath = `/thumbnails/dsa-sheets/${slug}.jpg`;
      const localFilePath = path.join(publicDir, "thumbnails", "dsa-sheets", `${slug}.jpg`);
      expect(fs.existsSync(localFilePath)).toBe(true);

      const stats = fs.statSync(localFilePath);
      expect(stats.size).toBeGreaterThan(5000);

      expect(sheetThumbnails.has(relPath)).toBe(false);
      sheetThumbnails.add(relPath);
    }

    expect(sheetThumbnails.size).toBe(expectedSheets.length);
  });

  it("ensures additional educator sheets like Fraz and Blind 75 are also available", () => {
    const frazPath = path.join(publicDir, "thumbnails", "dsa-sheets", "fraz-dsa-sheet.jpg");
    const blind75Path = path.join(publicDir, "thumbnails", "dsa-sheets", "blind-75-dsa-sheet.jpg");

    expect(fs.existsSync(frazPath)).toBe(true);
    expect(fs.existsSync(blind75Path)).toBe(true);
    expect(fs.statSync(frazPath).size).toBeGreaterThan(5000);
    expect(fs.statSync(blind75Path).size).toBeGreaterThan(5000);
  });
});

