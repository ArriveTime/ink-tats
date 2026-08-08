document.addEventListener("DOMContentLoaded", () => {
  // Unique namespace key for InkTat site counter
  const COUNTER_NAMESPACE = "inktat_site_2026";
  const COUNTER_KEY = "visitors";
  const API_BASE = `https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}`;

  // Check if current page is Admin or Main Site
  const isAdminPage = document.body.classList.contains("admin-page");

  if (!isAdminPage) {
    // --- MAIN SITE LOGIC ---
    incrementVisitorCount(API_BASE);

    // High Contrast Toggle
    const contrastToggle = document.getElementById("contrast-toggle");
    if (contrastToggle) {
      contrastToggle.addEventListener("click", () => {
        document.body.classList.toggle("high-contrast");
      });
    }

    loadTattooNews();
    setupGalleryUploads();
  } else {
    // --- ADMIN PAGE LOGIC ---
    startLiveClock();
    fetchVisitorCount(API_BASE);
    renderSessionLog();
  }
});

/* Visitor Counter Functions */
function incrementVisitorCount(apiEndpoint) {
  // Call API to increment hit counter
  fetch(`${apiEndpoint}/up`)
    .then(res => res.json())
    .then(data => {
      // Record local session log entry
      saveSessionLog(data.count || 1);
    })
    .catch(() => {
      // Local fallback counter if API is offline
      let localCount = parseInt(localStorage.getItem("inktat_visitor_count") || "0") + 1;
      localStorage.setItem("inktat_visitor_count", localCount.toString());
      saveSessionLog(localCount);
    });
}

function fetchVisitorCount(apiEndpoint) {
  const countDisplay = document.getElementById("visitor-count");

  fetch(apiEndpoint)
    .then(res => res.json())
    .then(data => {
      if (countDisplay) countDisplay.textContent = data.count.toLocaleString();
    })
    .catch(() => {
      // Fallback display
      let localCount = localStorage.getItem("inktat_visitor_count") || "1";
      if (countDisplay) countDisplay.textContent = parseInt(localCount).toLocaleString();
    });
}

/* Real-Time Clock & Date Function */
function startLiveClock() {
  const dateDisplay = document.getElementById("live-date");
  const timeDisplay = document.getElementById("live-time");

  function updateClock() {
    const now = new Date();
    
    if (dateDisplay) {
      dateDisplay.textContent = now.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    if (timeDisplay) {
      timeDisplay.textContent = now.toLocaleTimeString();
    }
  }

  updateClock();
  setInterval(updateClock, 1000); // Updates every second
}

/* Local Session Logging for Admin View */
function saveSessionLog(currentCount) {
  let logs = JSON.parse(localStorage.getItem("inktat_session_logs") || "[]");
  const now = new Date();
  
  const newLog = {
    id: `#${1000 + (logs.length + 1)}`,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    totalCountAtVisit: currentCount
  };

  logs.unshift(newLog);
  if (logs.length > 15) logs.pop(); // Keep last 15 records
  localStorage.setItem("inktat_session_logs", JSON.stringify(logs));
}

function renderSessionLog() {
  const tbody = document.getElementById("session-log-body");
  if (!tbody) return;

  let logs = JSON.parse(localStorage.getItem("inktat_session_logs") || "[]");

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No recent session data logged yet. Visit the main homepage to record visits.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => `
    <tr>
      <td>${log.id}</td>
      <td>${log.date}</td>
      <td>${log.time}</td>
      <td><span style="color: #00ff66;">Active Session</span> (Total Hits: ${log.totalCountAtVisit})</td>
    </tr>
  `).join("");
}

/* News Feed loader */
function loadTattooNews() {
  const newsContainer = document.getElementById("news-container");
  if (!newsContainer) return;

  const newsItems = [
    {
      title: "Exploring New Organic & Vegan Tattoo Inks in 2026",
      source: "Inked Magazine",
      snippet: "How modern ink chemistry is improving color longevity while maintaining eco-friendly and hypoallergenic standards.",
      url: "https://www.inkedmag.com"
    },
    {
      title: "Tattoo Convention Trends: Micro-Realism & Fine-Line Mastery",
      source: "World Tattoo Events",
      snippet: "A look at the most popular techniques dominating major expo competitions across the United States this year.",
      url: "https://www.worldtattooevents.com"
    },
    {
      title: "Essential Aftercare Tips for Longevity and Vibrant Colors",
      source: "Tattoo.com",
      snippet: "Dermatologist-approved healing protocols to prevent color fading and speed up skin recovery after fresh ink.",
      url: "https://www.tattoo.com"
    }
  ];

  newsContainer.innerHTML = `
    <div class="card-grid">
      ${newsItems.map(item => `
        <article class="news-card">
          <h3>${item.title}</h3>
          <p><strong>Source:</strong> ${item.source}</p>
          <p>${item.snippet}</p>
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="link-btn">Read Full Article</a>
        </article>
      `).join("")}
    </div>
  `;
}

/* Community Upload Handler */
function setupGalleryUploads() {
  const uploadForm = document.getElementById("upload-form");
  const postsContainer = document.getElementById("posts-container");
  if (!uploadForm || !postsContainer) return;

  let savedPosts = JSON.parse(localStorage.getItem("inktat_posts")) || [];
  renderPosts(savedPosts);

  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("tat-title").value;
    const artist = document.getElementById("artist-name").value || "Unknown Artist";
    const imageFile = document.getElementById("tat-image").files[0];

    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const newPost = {
        id: Date.now(),
        title: title,
        artist: artist,
        imageData: event.target.result,
        comments: []
      };

      savedPosts.unshift(newPost);
      localStorage.setItem("inktat_posts", JSON.stringify(savedPosts));
      renderPosts(savedPosts);
      uploadForm.reset();
    };

    reader.readAsDataURL(imageFile);
  });

  function renderPosts(posts) {
    postsContainer.innerHTML = "";

    if (posts.length === 0) {
      postsContainer.innerHTML = "<p style='grid-column: 1/-1;'>No tattoos uploaded yet. Be the first to share your ink above!</p>";
      return;
    }

    posts.forEach((post) => {
      const card = document.createElement("article");
      card.className = "post-card";

      card.innerHTML = `
        <h3>${escapeHtml(post.title)}</h3>
        <p><strong>Artist/Studio:</strong> ${escapeHtml(post.artist)}</p>
        <img src="${post.imageData}" alt="${escapeHtml(post.title)} tattoo showcase">
        
        <div class="comments-section">
          <h4>Comments (${post.comments.length})</h4>
          <ul class="comment-list">
            ${post.comments.map(c => `<li class="comment-item">${escapeHtml(c)}</li>`).join("")}
          </ul>
          <form class="comment-form" data-post-id="${post.id}">
            <input type="text" placeholder="Add a comment..." required aria-label="Add a comment">
            <button type="submit">Post</button>
          </form>
        </div>
      `;

      postsContainer.appendChild(card);
    });

    document.querySelectorAll(".comment-form").forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const postId = Number(form.getAttribute("data-post-id"));
        const commentInput = form.querySelector("input");
        const commentText = commentInput.value.trim();

        if (commentText) {
          savedPosts = savedPosts.map(p => {
            if (p.id === postId) p.comments.push(commentText);
            return p;
          });
          localStorage.setItem("inktat_posts", JSON.stringify(savedPosts));
          renderPosts(savedPosts);
        }
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}
