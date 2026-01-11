// Inject search bar at the top of every page
document.addEventListener("DOMContentLoaded", () => {
  const searchBar = `
        <div style="position: sticky; top: 0; z-index: 1000; background-color: #2a2a2a; padding: 8px 15px; margin-bottom: 15px; border-bottom: 2px solid #ff4444; box-shadow: 0 2px 10px rgba(0,0,0,0.5);">
            <div style="max-width: 1400px; margin: 0 auto; padding: 0 20px; text-align: center;">
                <form action="/search.html" method="get" style="margin: 0; display: inline-block; width: 100%; max-width: 600px;">
                    <input 
                        type="text" 
                        name="q" 
                        placeholder="🔍 Search all guides..." 
                        style="width: 100%; padding: 12px; background-color: #1a1a1a; border: 1px solid #444; color: #f0f0f0; font-size: 16px; box-sizing: border-box; -webkit-appearance: none; border-radius: 4px;"
                    >
                </form>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("afterbegin", searchBar);
});
