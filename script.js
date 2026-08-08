document.addEventListener("DOMContentLoaded", () => {
  const COUNTER_NAMESPACE = "inktat_official_2026";
  const COUNTER_KEY = "visits";
  
  const API_GET = `https://api.countapi.xyz/get/${COUNTER_NAMESPACE}/${COUNTER_KEY}`;
  const API_HIT = `https://api.countapi.xyz/hit/${COUNTER_NAMESPACE}/${COUNTER_KEY}`;

  const isAdminPage = document.body.classList.contains("admin-page");

  // Ensure user token exists for ban checks
  getUserToken();

  if (!isAdminPage) {
    // --- MAIN HOMEPAGE ---
    registerVisitorHit(API_HIT);

    const contrastToggle = document.getElementById("contrast-toggle");
    if (contrastToggle) {
      contrastToggle.addEventListener("click", () => {
        document.body.classList.toggle("high-contrast");
      });
    }

    loadTattooNews();
    setupGalleryUploads();
  } else {
    // --- ADMIN PAGE ---
    const contrastToggle = document.getElementById("contrast-toggle");
    if (contrastToggle) {
      contrastToggle.addEventListener("click", () => {
        document.body.classList.toggle("high-contrast");
      });
    }

    startLiveClock();

    const checkUnlockAndLoad = setInterval(() => {
      const dashboard = document.getElementById("admin-dashboard");
      if (dashboard && !dashboard.classList.contains("dashboard-hidden")) {
        fetchVisitorCount(API_GET);
        renderSessionLog();
        renderAdminModerationQueue();
        renderBannedUsersTable();
        clearInterval(checkUnlockAndLoad);
      }
    }, 300);
  }
});

/* Get or Generate Device/User Identifier */
function getUserToken() {
  let token = localStorage.getItem("inktat_user_token");
  if (!token) {
    token = "USER_" + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem("inktat_user_token", token);
  }
  return token;
}

function isUserBanned() {
  const userToken = getUserToken();
  const bannedList = JSON.parse(localStorage.getItem("inktat_banned_tokens") || "[]");
  return bannedList.some(b => b.token === userToken);
}

/* Visitor Counter Functions */
function registerVisitorHit(apiEndpoint) {
  fetch(apiEndpoint)
    .then(res => res.json())
    .then(data => {
      if (data && data.value) {
        localStorage.setItem("inktat_last_known_count", data.value);
        saveSessionLog(data.value);
      }
    })
    .catch(() => {
      let count = parseInt(localStorage.getItem("inktat_local_counter") || "100") + 1;
      localStorage.setItem("inktat_local_counter", count);
      localStorage.setItem("inktat_last_known_count", count);
      saveSessionLog(count);
    });
}

function fetchVisitorCount(apiEndpoint) {
  const countDisplay = document.getElementById("visitor-count");
  if (!countDisplay) return;

  fetch(apiEndpoint)
    .then(res => res.json())
    .then(data => {
      if (data && data.value !== undefined) {
        countDisplay.textContent = Number(data.value).toLocaleString();
      } else {
        useFallbackCount(countDisplay);
      }
    })
    .catch(() => {
      useFallbackCount(countDisplay);
    });
}

function useFallbackCount(element) {
  let savedCount = localStorage.getItem("inktat_last_known_count") || localStorage.getItem("inktat_local_counter") || "1";
  element.textContent = Number(savedCount).toLocaleString();
}

/* Real-Time Clock & Date */
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
  setInterval(updateClock, 1000);
}

/* Local Session Logging */
function saveSessionLog(currentCount) {
  let logs = JSON.parse(localStorage.getItem("inktat_session_logs") || "[]");
  const now = new Date();
  
  const newLog = {
    id: `#${Math.floor(10000 + Math.random() * 90000)}`,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    totalCountAtVisit: currentCount
  };

  logs.unshift(newLog);
  if (logs.length > 15) logs.pop();
  localStorage.setItem("inktat_session_logs", JSON.stringify(logs));
}

function renderSessionLog() {
  const tbody = document.getElementById("session-log-body");
  if (!tbody) return;

  let logs = JSON.parse(localStorage.getItem("inktat_session_logs") || "[]");

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No recent session activity recorded. Visit the home page to trigger visit logs.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => `
    <tr>
      <td>${log.id}</td>
      <td>${log.date}</td>
      <td>${log.time}</td>
      <td><span style="color: #00ff66;">Logged Visit</span> (Count: ${log.totalCountAtVisit})</td>
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

/* Main Site Gallery Upload & Comment Setup */
function setupGalleryUploads() {
  const uploadForm = document.getElementById("upload-form");
  const postsContainer = document.getElementById("posts-container");
  if (!uploadForm || !postsContainer) return;

  let savedPosts = JSON.parse(localStorage.getItem("inktat_posts")) || [];
  renderPosts(savedPosts);

  uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (isUserBanned()) {
      alert("Your account/device has been banned from submitting posts due to policy violations.");
      return;
    }

    const title = document.getElementById("tat-title").value;
    const artist = document.getElementById("artist-name").value || "Unknown Artist";
    const imageFile = document.getElementById("tat-image").files[0];

    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const newPost = {
        id: Date.now(),
        userToken: getUserToken(),
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
            ${post.comments.map(c => `<li class="comment-item">${escapeHtml(c.text || c)}</li>`).join("")}
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

        if (isUserBanned()) {
          alert("Your account/device has been banned from posting comments.");
          return;
        }

        const postId = Number(form.getAttribute("data-post-id"));
        const commentInput = form.querySelector("input");
        const commentText = commentInput.value.trim();

        if (commentText) {
          savedPosts = savedPosts.map(p => {
            if (p.id === postId) {
              p.comments.push({ id: Date.now(), userToken: getUserToken(), text: commentText });
            }
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

/* ADMIN MODERATION & BAN LOGIC */
function renderAdminModerationQueue() {
  const container = document.getElementById("admin-moderation-list");
  if (!container) return;

  let posts = JSON.parse(localStorage.getItem("inktat_posts") || "[]");

  if (posts.length === 0) {
    container.innerHTML = "<p>No active community posts to moderate.</p>";
    return;
  }

  container.innerHTML = "";

  posts.forEach(post => {
    const card = document.createElement("article");
    card.className = "post-card";
    card.style.border = "1px solid var(--accent-color)";

    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <p><strong>Poster Identifier:</strong> <code>${post.userToken || "Unknown"}</code></p>
      <img src="${post.imageData}" alt="Post moderation preview">
      
      <div style="margin: 1rem 0;">
        <button class="btn-delete" onclick="adminDeletePost(${post.id})">Delete Post</button>
        <button class="btn-ban" onclick="adminBanUser('${post.userToken}')">Ban User</button>
      </div>

      <div class="comments-section">
        <h4>Comments (${post.comments.length})</h4>
        <ul class="comment-list">
          ${post.comments.map(c => `
            <li class="comment-item" style="display:flex; justify-content:space-between; align-items:center;">
              <span>${escapeHtml(c.text || c)}</span>
              <button class="btn-delete" style="padding:0.2rem 0.5rem; font-size:0.8rem;" onclick="adminDeleteComment(${post.id}, ${c.id || 0})">Delete</button>
            </li>
          `).join("")}
        </ul>
      </div>
    `;

    container.appendChild(card);
  });
}

window.adminDeletePost = function(postId) {
  if (confirm("Are you sure you want to delete this tattoo post?")) {
    let posts = JSON.parse(localStorage.getItem("inktat_posts") || "[]");
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem("inktat_posts", JSON.stringify(posts));
    renderAdminModerationQueue();
  }
};

window.adminDeleteComment = function(postId, commentId) {
  let posts = JSON.parse(localStorage.getItem("inktat_posts") || "[]");
  posts = posts.map(p => {
    if (p.id === postId) {
      p.comments = p.comments.filter(c => (c.id || 0) !== commentId);
    }
    return p;
  });
  localStorage.setItem("inktat_posts", JSON.stringify(posts));
  renderAdminModerationQueue();
};

window.adminBanUser = function(userToken) {
  if (!userToken || userToken === "Unknown") {
    alert("Cannot ban unknown identifier.");
    return;
  }

  if (confirm(`Are you sure you want to BAN user ${userToken}? They will no longer be able to post or comment.`)) {
    let banned = JSON.parse(localStorage.getItem("inktat_banned_tokens") || "[]");
    if (!banned.some(b => b.token === userToken)) {
      banned.push({ token: userToken, date: new Date().toLocaleDateString() });
      localStorage.setItem("inktat_banned_tokens", JSON.stringify(banned));
    }
    renderBannedUsersTable();
    alert(`User ${userToken} has been banned.`);
  }
};

function renderBannedUsersTable() {
  const tbody = document.getElementById("banned-users-body");
  if (!tbody) return;

  let banned = JSON.parse(localStorage.getItem("inktat_banned_tokens") || "[]");

  if (banned.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No users or devices are currently banned.</td></tr>`;
    return;
  }

  tbody.innerHTML = banned.map(b => `
    <tr>
      <td><code>${b.token}</code></td>
      <td>${b.date}</td>
      <td><button class="btn-delete" style="background-color:#444;" onclick="adminUnbanUser('${b.token}')">Unban</button></td>
    </tr>
  `).join("");
}

window.adminUnbanUser = function(userToken) {
  let banned = JSON.parse(localStorage.getItem("inktat_banned_tokens") || "[]");
  banned = banned.filter(b => b.token !== userToken);
  localStorage.setItem("inktat_banned_tokens", JSON.stringify(banned));
  renderBannedUsersTable();
};

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
