// List of all pages to search (you still maintain this list, but no keywords needed)
const pages = [
  { title: "Home", url: "/index.html" },
  { title: "Level 1: Mars City", url: "/guides/level-1.html" },
  // Add more pages as you create them
  // { title: "Level 2: Underground", url: "/guides/level-2.html" },
];

// Cache for page content (so we don't fetch repeatedly)
const contentCache = {};

async function fetchPageContent(url) {
  if (contentCache[url]) {
    return contentCache[url];
  }

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Parse HTML and extract text content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove script and style tags
    doc.querySelectorAll("script, style").forEach((el) => el.remove());

    // Get all text content
    const textContent = doc.body.textContent || doc.body.innerText || "";

    contentCache[url] = {
      title:
        doc.querySelector("title")?.textContent ||
        doc.querySelector("h1")?.textContent ||
        "Untitled",
      content: textContent.replace(/\s+/g, " ").trim(), // Clean up whitespace
    };

    return contentCache[url];
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return { title: "Error", content: "" };
  }
}

async function searchPages(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase();
  const results = [];

  // Search through all pages
  for (const page of pages) {
    const pageData = await fetchPageContent(page.url);
    const searchableText =
      `${pageData.title} ${pageData.content}`.toLowerCase();

    if (searchableText.includes(searchTerm)) {
      // Find snippet with the search term
      const index = pageData.content.toLowerCase().indexOf(searchTerm);
      const start = Math.max(0, index - 60);
      const end = Math.min(pageData.content.length, index + 100);
      let snippet = pageData.content.substring(start, end);

      if (start > 0) snippet = "..." + snippet;
      if (end < pageData.content.length) snippet = snippet + "...";

      results.push({
        title: pageData.title,
        url: page.url,
        snippet: snippet,
      });
    }
  }

  return results;
}
