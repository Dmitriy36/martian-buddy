// Search index - add all your pages and their searchable content here
const searchIndex = [
  {
    title: "Level 1: Mars City",
    url: "/guides/level-1.html",
    keywords:
      "mars city introduction tutorial walkthrough locker codes 123 531 armor health ammo pda security guard invasion",
    content:
      "This is the introductory level where you arrive at Mars City and get familiar with the environment before things go wrong.",
  },
  // Add more pages as you create them
];

function searchPages(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase();

  return searchIndex
    .filter((page) => {
      const searchableText =
        `${page.title} ${page.keywords} ${page.content}`.toLowerCase();
      return searchableText.includes(searchTerm);
    })
    .map((page) => ({
      title: page.title,
      url: page.url,
      snippet: page.content,
    }));
}
