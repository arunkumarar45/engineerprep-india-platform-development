import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function main() {
  console.log("=== Generating Brand Assets for EngineerPrep India ===");

  const publicDir = path.join(process.cwd(), "public");
  const imagesDir = path.join(publicDir, "images");
  const appDir = path.join(process.cwd(), "src", "app");

  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  // 1. Logo SVG (Orange squircle with white Graduation Cap)
  const logoSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF7A1A" />
        <stop offset="100%" stop-color="#FF5A00" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#FF5A00" flood-opacity="0.3" />
      </filter>
    </defs>
    <!-- Background rounded squircle -->
    <rect x="32" y="32" width="448" height="448" rx="112" fill="url(#brandGrad)" filter="url(#shadow)" />
    
    <!-- Graduation Cap Icon -->
    <path d="M256 140L80 236L256 332L432 236L256 140Z" fill="white" />
    <path d="M144 271V356C144 380 194 400 256 400C318 400 368 380 368 356V271L256 332L144 271Z" fill="white" fill-opacity="0.9" />
    <!-- Tassel -->
    <path d="M400 254V340C400 354 390 364 384 364C378 364 374 354 374 340V268L400 254Z" fill="#FFF2E6" />
    <circle cx="400" cy="254" r="10" fill="white" />
  </svg>
  `;

  // Write logo.png (512x512)
  await sharp(Buffer.from(logoSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(imagesDir, "logo.png"));
  console.log("Created public/images/logo.png (512x512)");

  // Write app icon.png (512x512)
  await sharp(Buffer.from(logoSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(appDir, "icon.png"));
  console.log("Created src/app/icon.png (512x512)");

  // Write apple-icon.png (180x180)
  await sharp(Buffer.from(logoSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(appDir, "apple-icon.png"));
  console.log("Created src/app/apple-icon.png (180x180)");

  // Write favicon-32x32 into public/favicon.ico
  await sharp(Buffer.from(logoSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, "favicon.ico"));
  console.log("Created public/favicon.ico");

  // Also in app directory
  await sharp(Buffer.from(logoSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(appDir, "favicon.ico"));
  console.log("Created src/app/favicon.ico");

  // Write icon.svg
  fs.writeFileSync(path.join(appDir, "icon.svg"), logoSvg.trim());
  fs.writeFileSync(path.join(publicDir, "icon.svg"), logoSvg.trim());
  console.log("Created icon.svg");

  // 2. OpenGraph Social Image (1200x630)
  const ogSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0E161E" />
        <stop offset="60%" stop-color="#141E28" />
        <stop offset="100%" stop-color="#1A2734" />
      </linearGradient>
      <radialGradient id="glow" cx="80%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#FF5A00" stop-opacity="0.32" />
        <stop offset="100%" stop-color="#FF5A00" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF7A1A" />
        <stop offset="100%" stop-color="#FF5A00" />
      </linearGradient>
    </defs>

    <!-- Canvas Background -->
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <rect width="1200" height="630" fill="url(#glow)" />

    <!-- Top Left Brand Badge -->
    <g transform="translate(80, 70)">
      <rect width="56" height="56" rx="16" fill="url(#cardGrad)" />
      <!-- Cap inside badge -->
      <path d="M28 17L12 26L28 35L44 26L28 17Z" fill="white" />
      <path d="M18 29.5V37C18 39.5 22.5 41.5 28 41.5C33.5 41.5 38 39.5 38 37V29.5L28 35L18 29.5Z" fill="white" />
      
      <!-- Brand Text -->
      <text x="72" y="32" font-family="Inter, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">EngineerPrep India</text>
      <text x="72" y="52" font-family="Inter, -apple-system, sans-serif" font-size="14" font-weight="700" letter-spacing="2" fill="#FF7A1A">LEARN. PRACTICE. PREPARE. GET HIRED.</text>
    </g>

    <!-- Headline -->
    <text x="80" y="240" font-family="Inter, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" letter-spacing="-1">
      Everything You Need for Your
    </text>
    <text x="80" y="304" font-family="Inter, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#FF5A00" letter-spacing="-1">
      Engineering Journey.
    </text>

    <!-- Subtitle -->
    <text x="80" y="370" font-family="Inter, -apple-system, sans-serif" font-size="22" font-weight="500" fill="#94A3B8">
      VTU Notes, Previous Year Question Papers, Syllabus, Curated DSA Sheets,
    </text>
    <text x="80" y="405" font-family="Inter, -apple-system, sans-serif" font-size="22" font-weight="500" fill="#94A3B8">
      Developer Roadmaps, Mock Tests and Engineering Job Opportunities.
    </text>

    <!-- Feature Pills -->
    <g transform="translate(80, 480)">
      <!-- Pill 1 -->
      <rect x="0" y="0" width="220" height="52" rx="14" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.15" />
      <text x="32" y="32" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">📚 VTU Resources</text>

      <!-- Pill 2 -->
      <rect x="240" y="0" width="230" height="52" rx="14" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.15" />
      <text x="272" y="32" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">💻 Curated DSA Sheets</text>

      <!-- Pill 3 -->
      <rect x="490" y="0" width="220" height="52" rx="14" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.15" />
      <text x="522" y="32" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">🎯 Developer Roadmaps</text>

      <!-- Pill 4 -->
      <rect x="730" y="0" width="220" height="52" rx="14" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.15" />
      <text x="762" y="32" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">💼 Jobs &amp; Internships</text>
    </g>

    <!-- Bottom URL Tag -->
    <text x="80" y="585" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#64748B">
      engineerprep.in · India&apos;s Engineering &amp; Placement Preparation Platform
    </text>
  </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(imagesDir, "og-image.png"));
  console.log("Created public/images/og-image.png (1200x630)");

  console.log("=== All Brand & OpenGraph Assets Successfully Generated ===");
}

main().catch(console.error);

