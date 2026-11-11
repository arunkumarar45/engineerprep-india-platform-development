import { DiscoveredResourceInput, VtuAcademicCategory } from "../types";

export class VtuCircleAdapter {
  readonly name = "VTU Circle (vtucircle.com)";
  readonly baseUrl = "https://vtucircle.com";

  async discoverResources(category: VtuAcademicCategory): Promise<DiscoveredResourceInput[]> {
    const results: DiscoveredResourceInput[] = [];

    let searchPath = "";
    if (category === "QUESTION_PAPER") searchPath = "/vtu-question-papers/";
    else if (category === "LAB_MANUAL") searchPath = "/vtu-lab-manuals/";
    else if (category === "ASSIGNMENT") searchPath = "/vtu-important-questions/";
    else if (category === "SYLLABUS") searchPath = "/vtu-syllabus/";

    const targetUrl = `${this.baseUrl}${searchPath}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });
      clearTimeout(timer);

      if (!response.ok) return results;
      const html = await response.text();

      // Extract PDF or Google Drive links
      const linkRegex = /<a[^>]+href=["']([^"']+(?:\.pdf|drive\.google\.com\/file\/d\/[^"']+))["'][^>]*>(.*?)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        const fileUrl = match[1].trim();
        const rawText = match[2].replace(/<[^>]+>/g, "").trim();

        if (!fileUrl.startsWith("http")) continue;

        const codeMatch = rawText.match(/\b([12][0-9][A-Z]{2,4}[0-9]{2,3}[A-Z]?|[A-Z]{3,4}[0-9]{3}[A-Z]?)\b/i);
        const subjectCode = codeMatch ? codeMatch[1].toUpperCase() : undefined;

        const semMatch = rawText.match(/(\d)(?:st|nd|rd|th)?\s*sem/i);
        const semesterNumber = semMatch ? parseInt(semMatch[1], 10) : undefined;

        results.push({
          title: rawText || `VTU ${category} Resource`,
          category,
          subjectCode,
          semesterNumber,
          schemeName: "2022 Scheme",
          sourceWebsite: "vtucircle.com",
          sourcePageUrl: targetUrl,
          originalFileUrl: fileUrl,
        });
      }
    } catch (err) {
      console.warn(`[VtuCircleAdapter] Discovery for ${category} timed out or failed gracefully:`, err);
    }

    return results;
  }
}

