import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function main() {
  const imagesDir = path.join(process.cwd(), "public", "images");
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  const svg = `
<svg width="640" height="520" viewBox="0 0 640 520" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Soft Backdrop Glow -->
  <circle cx="320" cy="260" r="220" fill="url(#hero_glow)" opacity="0.6"/>

  <!-- Code Editor Window -->
  <g filter="url(#shadow_drop)">
    <rect x="70" y="80" width="500" height="360" rx="16" fill="#18181B" stroke="#27272A" stroke-width="2"/>
    
    <!-- Window Bar -->
    <rect x="70" y="80" width="500" height="40" rx="16" fill="#27272A"/>
    <circle cx="95" cy="100" r="6" fill="#EF4444"/>
    <circle cx="115" cy="100" r="6" fill="#F59E0B"/>
    <circle cx="135" cy="100" r="6" fill="#10B981"/>
    
    <text x="320" y="104" text-anchor="middle" fill="#A1A1AA" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">engineerprep.in — placement_solution.cpp</text>
    
    <!-- Code Lines -->
    <text x="100" y="150" fill="#F97316" font-family="monospace" font-size="14" font-weight="600">class</text>
    <text x="145" y="150" fill="#60A5FA" font-family="monospace" font-size="14" font-weight="600">Solution</text>
    <text x="215" y="150" fill="#E4E4E7" font-family="monospace" font-size="14">{</text>
    
    <text x="120" y="180" fill="#F97316" font-family="monospace" font-size="14" font-weight="600">public:</text>
    <text x="140" y="210" fill="#A78BFA" font-family="monospace" font-size="14">vector&lt;int&gt;</text>
    <text x="235" y="210" fill="#34D399" font-family="monospace" font-size="14" font-weight="600">twoSum</text>
    <text x="295" y="210" fill="#E4E4E7" font-family="monospace" font-size="14">(vector&lt;int&gt;&amp; nums, int target) {</text>
    
    <text x="160" y="240" fill="#A1A1AA" font-family="monospace" font-size="13">// Striver &amp; NeetCode Optimized O(n) Hash Map</text>
    <text x="160" y="265" fill="#A78BFA" font-family="monospace" font-size="14">unordered_map&lt;int, int&gt;</text>
    <text x="350" y="265" fill="#E4E4E7" font-family="monospace" font-size="14">mp;</text>
    
    <text x="160" y="295" fill="#F97316" font-family="monospace" font-size="14" font-weight="600">for</text>
    <text x="190" y="295" fill="#E4E4E7" font-family="monospace" font-size="14">(int i = 0; i &lt; nums.size(); i++) {</text>
    
    <text x="180" y="325" fill="#F97316" font-family="monospace" font-size="14" font-weight="600">if</text>
    <text x="200" y="325" fill="#E4E4E7" font-family="monospace" font-size="14">(mp.count(target - nums[i]))</text>
    <text x="400" y="325" fill="#F97316" font-family="monospace" font-size="14" font-weight="600">return</text>
    <text x="455" y="325" fill="#E4E4E7" font-family="monospace" font-size="14">{mp[target - nums[i]], i};</text>
    
    <text x="180" y="355" fill="#E4E4E7" font-family="monospace" font-size="14">mp[nums[i]] = i;</text>
    <text x="160" y="380" fill="#E4E4E7" font-family="monospace" font-size="14">}</text>
    <text x="120" y="405" fill="#E4E4E7" font-family="monospace" font-size="14">}</text>
    <text x="100" y="425" fill="#E4E4E7" font-family="monospace" font-size="14">};</text>
  </g>

  <!-- Overlay Badges -->
  <!-- Top Right Verified Badge -->
  <g filter="url(#shadow_badge)">
    <rect x="420" y="45" width="180" height="52" rx="12" fill="#FFFFFF" stroke="#F97316" stroke-width="1.5"/>
    <circle cx="445" cy="71" r="14" fill="#FFEDD5"/>
    <path d="M440 71L444 75L451 67" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="468" y="65" fill="#18181B" font-family="system-ui, sans-serif" font-size="11" font-weight="700">DSA Verified</text>
    <text x="468" y="80" fill="#71717A" font-family="system-ui, sans-serif" font-size="10" font-weight="500">450+ Top Problems</text>
  </g>

  <!-- Bottom Left Success Badge -->
  <g filter="url(#shadow_badge)">
    <rect x="30" y="380" width="190" height="56" rx="12" fill="#FFFFFF" stroke="#10B981" stroke-width="1.5"/>
    <circle cx="58" cy="408" r="14" fill="#D1FAE5"/>
    <path d="M53 408L57 412L64 404" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="80" y="402" fill="#18181B" font-family="system-ui, sans-serif" font-size="11" font-weight="700">Placement Ready</text>
    <text x="80" y="418" fill="#71717A" font-family="system-ui, sans-serif" font-size="10" font-weight="500">VTU Notes + Curated Sheets</text>
  </g>

  <defs>
    <radialGradient id="hero_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(320 260) rotate(90) scale(220)">
      <stop stop-color="#FF5A00" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#FF5A00" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow_drop" x="50" y="65" width="540" height="400" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#18181B" flood-opacity="0.25"/>
    </filter>
    <filter id="shadow_badge" x="20" y="35" width="600" height="420" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
</svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(imagesDir, "hero-student.png"));

  console.log("Successfully generated public/images/hero-student.png!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Hero image error:", err);
  process.exit(1);
});

