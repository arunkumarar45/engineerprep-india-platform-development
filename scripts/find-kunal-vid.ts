async function findKunal() {
  const url = "https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7mUgf5U9lQQzkb1";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    // Look for videoId
    const matches = Array.from(html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)).map(m => m[1]);
    console.log("Kunal playlist video IDs found:", Array.from(new Set(matches)).slice(0, 10));
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
findKunal();

