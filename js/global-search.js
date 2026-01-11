// Inject search bar at the top of every page
document.addEventListener("DOMContentLoaded", () => {
  const searchBar = `
        <div style="background-color: #2a2a2a; padding: 15px; margin-bottom: 30px; border-bottom: 2px solid #ff4444;">
            <div style="max-width: 800px; margin: 0 auto;">
                <form action="/search.html" method="get" style="margin: 0;">
                    <input 
                        type="text" 
                        name="q" 
                        placeholder="🔍 Search all guides..." 
                        style="width: 100%; padding: 12px; background-color: #1a1a1a; border: 1px solid #444; color: #f0f0f0; font-size: 1em; box-sizing: border-box;"
                    >
                </form>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("afterbegin", searchBar);
});
