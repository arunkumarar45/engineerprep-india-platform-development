import { DiscoveredResourceInput, VtuAcademicCategory } from "../types";

export interface VtuScrapeOptions {
  category?: VtuAcademicCategory;
  branchCode?: string;
  schemeName?: string;
  semesterNumber?: number;
}

export class VtuOfficialAdapter {
  readonly name = "VTU Official (vtu.ac.in)";
  readonly baseUrl = "https://vtu.ac.in";

  async discoverModelQuestionPapers(): Promise<DiscoveredResourceInput[]> {
    const targetUrl = "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/";
    const results: DiscoveredResourceInput[] = [];

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) return results;
      const html = await response.text();

      // Match anchors linking to .pdf files
      const linkRegex = /<a[^>]+href=["']([^"']+\.pdf)["'][^>]*>(.*?)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        let pdfUrl = match[1].trim();
        const rawText = match[2].replace(/<[^>]+>/g, "").trim();

        if (!pdfUrl.startsWith("http")) {
          pdfUrl = pdfUrl.startsWith("/")
            ? `https://vtu.ac.in${pdfUrl}`
            : `https://vtu.ac.in/${pdfUrl}`;
        }

        // Extract subject code (e.g., BCS601, 21CS51, etc.)
        const codeMatch = rawText.match(/\b([12][0-9][A-Z]{2,4}[0-9]{2,3}[A-Z]?|[A-Z]{3,4}[0-9]{3}[A-Z]?)\b/i);
        const subjectCode = codeMatch ? codeMatch[1].toUpperCase() : undefined;

        // Extract semester
        const semMatch = rawText.match(/(\d)(?:st|nd|rd|th)?\s*sem/i) || html.match(/sem(?:ester)?\s*(\d)/i);
        const semesterNumber = semMatch ? parseInt(semMatch[1], 10) : undefined;

        // Scheme
        let schemeName = "2022 Scheme";
        if (rawText.includes("2021") || subjectCode?.startsWith("21")) schemeName = "2021 Scheme";
        if (rawText.includes("2018") || subjectCode?.startsWith("18")) schemeName = "2018 Scheme";

        results.push({
          title: rawText || `VTU Model Question Paper - ${subjectCode || "Official"}`,
          category: "QUESTION_PAPER",
          subjectCode,
          schemeName,
          semesterNumber,
          sourceWebsite: "vtu.ac.in",
          sourcePageUrl: targetUrl,
          originalFileUrl: pdfUrl,
          examType: "MODEL_QUESTION_PAPER",
        });
      }
    } catch (err) {
      console.error("[VtuOfficialAdapter] MQP scrape error:", err);
    }

    return results;
  }

  async discoverSyllabus(): Promise<DiscoveredResourceInput[]> {
    const targetUrl = "https://vtu.ac.in/en/b-e-scheme-syllabus/";
    const results: DiscoveredResourceInput[] = [];

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) return results;
      const html = await response.text();

      const linkRegex = /<a[^>]+href=["']([^"']+\.pdf)["'][^>]*>(.*?)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        let pdfUrl = match[1].trim();
        const rawText = match[2].replace(/<[^>]+>/g, "").trim();

        if (!pdfUrl.startsWith("http")) {
          pdfUrl = pdfUrl.startsWith("/")
            ? `https://vtu.ac.in${pdfUrl}`
            : `https://vtu.ac.in/${pdfUrl}`;
        }

        // Branch detection
        let branchCode = "CSE";
        if (rawText.toLowerCase().includes("electronics") || rawText.toLowerCase().includes("ece")) {
          branchCode = "ECE";
        } else if (rawText.toLowerCase().includes("mechanical") || rawText.toLowerCase().includes("mech")) {
          branchCode = "MECH";
        } else if (rawText.toLowerCase().includes("civil")) {
          branchCode = "CIVIL";
        } else if (rawText.toLowerCase().includes("information science") || rawText.toLowerCase().includes("ise")) {
          branchCode = "ISE";
        }

        // Sem detection
        const semMatch = rawText.match(/(\d)(?:st|nd|rd|th)?\s*sem/i) || rawText.match(/sem(?:ester)?\s*([1-8])/i);
        const semesterNumber = semMatch ? parseInt(semMatch[1], 10) : undefined;

        // Scheme
        let schemeName = "2022 Scheme";
        if (rawText.includes("2021")) schemeName = "2021 Scheme";
        if (rawText.includes("2018")) schemeName = "2018 Scheme";

        results.push({
          title: rawText || `VTU Official Syllabus - ${branchCode} Sem ${semesterNumber || ""}`,
          category: "SYLLABUS",
          branchCode,
          schemeName,
          semesterNumber,
          sourceWebsite: "vtu.ac.in",
          sourcePageUrl: targetUrl,
          originalFileUrl: pdfUrl,
        });
      }
    } catch (err) {
      console.error("[VtuOfficialAdapter] Syllabus scrape error:", err);
    }

    return results;
  }
}

