// Custom bad words list - add words here as needed
// This is NOT visible in the browser to users - it's server-side only when logging
const customBadWords = [
  // "example1",
  // "example2",
];

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = customBadWords;
}
