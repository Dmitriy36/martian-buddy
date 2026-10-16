const SUPABASE_URL = "https://ewztgzyqrgvhgmbaldgn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3enRnenlxcmd2aGdtYmFsZGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjEwMjAsImV4cCI6MjA4MzczNzAyMH0.es4df8tu_c7sAKmjSHLD-SigOArXoZhB7JqQ27q0ouY";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// You'll need to pass the guide page name as a parameter
function initCommentSystem(guidePage) {
  // Load approved comments
  async function loadComments() {
    const { data, error } = await supabaseClient
      .from("comments")
      .select("*")
      .eq("guide_page", guidePage)
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading comments:", error);
      return;
    }

    const commentsList = document.getElementById("comments-list");
    if (data.length === 0) {
      commentsList.innerHTML = "<p><em>No tips yet. Be the first to contribute!</em></p>";
      return;
    }

    commentsList.innerHTML = data
      .map(
        (comment) => `
        <div class="tip">
            <strong>${escapeHtml(comment.author_name)}</strong> - ${new Date(
              comment.created_at,
            ).toLocaleDateString()}
            <p>${escapeHtml(comment.comment_text)}</p>
        </div>
    `,
      )
      .join("");
  }

  // Submit new comment
  document.getElementById("comment-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Check honeypot
    if (document.getElementById("honeypot").value !== "") {
      document.getElementById("form-message").textContent = "Spam detected.";
      return;
    }

    // Verify reCAPTCHA
    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
      document.getElementById("form-message").textContent = "Please complete the reCAPTCHA.";
      return;
    }

    const authorName = document.getElementById("author-name").value.trim();
    const commentText = document.getElementById("comment-text").value.trim();

    if (!authorName || !commentText) {
      document.getElementById("form-message").textContent = "Please fill in all fields.";
      return;
    }

    // Get user's IP address
    let userIP = "unknown";
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();
      userIP = ipData.ip;
    } catch (e) {
      console.log("Could not get IP");
    }

    // Check rate limit: max 3 comments per hour from same IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentComments, error: rateLimitError } = await supabaseClient
      .from("comments")
      .select("id")
      .eq("ip_address", userIP)
      .gte("created_at", oneHourAgo);

    if (rateLimitError) {
      console.error("Error checking rate limit:", rateLimitError);
    }

    if (recentComments && recentComments.length >= 3) {
      document.getElementById("form-message").textContent =
        "Rate limit exceeded. You can only submit 3 tips per hour. Please try again later.";
      return;
    }

    // Insert comment with IP address
    const { error } = await supabaseClient.from("comments").insert([
      {
        guide_page: guidePage,
        author_name: authorName,
        comment_text: commentText,
        approved: false,
        ip_address: userIP,
      },
    ]);

    if (error) {
      console.error("Error submitting comment:", error);
      document.getElementById("form-message").textContent =
        "Error submitting tip. Please try again.";
      return;
    }

    document.getElementById("form-message").textContent =
      "Thanks! Your tip will appear after moderation.";
    document.getElementById("comment-form").reset();
    grecaptcha.reset(); // Reset reCAPTCHA
  });

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Load comments on page load
  loadComments();
}

// Analytics tracking
async function trackPageView() {
  // Defaults used if every lookup fails, so a view is still logged.
  let ip = "unknown";
  let country = "unknown";
  let city = "unknown";

  // Step 1: get the IPv4 address. api.ipify.org is IPv4-only, so this
  // returns the short, tidy form whenever the visitor has IPv4.
  try {
    const v4Response = await fetch("https://api.ipify.org?format=json");
    const v4Data = await v4Response.json();
    if (v4Data && v4Data.ip) {
      ip = v4Data.ip;
    }
  } catch (e) {
    console.log("IPv4 lookup failed:", e);
  }

  // Step 2: get location. ipapi.co returns country/city, plus its own
  // IP reading. If step 1 got an IPv4, we keep that and only take the
  // location here. If step 1 failed (IPv6-only visitor), we fall back
  // to the IP ipapi.co reports, which will be their IPv6.
  try {
    const geoResponse = await fetch("https://ipapi.co/json/");
    const geoData = await geoResponse.json();
    if (geoData) {
      if (ip === "unknown" && geoData.ip) {
        ip = geoData.ip; // fallback: no IPv4 was found, log IPv6
      }
      country = geoData.country_name || country;
      city = geoData.city || city;
    }
  } catch (e) {
    console.log("Location lookup failed:", e);
  }

  try {
    await supabaseClient.from("page_views").insert([
      {
        page_path: window.location.pathname,
        ip_address: ip,
        country: country,
        city: city,
      },
    ]);
  } catch (e) {
    console.log("Analytics tracking failed:", e);
  }
}

// Track on page load
trackPageView();
