document.addEventListener("DOMContentLoaded", () => {
  // 1. High Contrast Accessibility Toggle
  const contrastToggle = document.getElementById("contrast-toggle");
  contrastToggle.addEventListener("click", () => {
    document.body.classList.toggle("high-contrast");
  });

  // 2. Load Curated Tattoo News
  loadTattooNews();

  // 3. User Photo Upload & Comment System (In-Browser Storage)
  const uploadForm = document.getElementById("upload-form");
  const postsContainer = document.getElementById("posts-container");

  // Load posts from localStorage on page load
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

    // Attach listener for dynamic comment forms
    document.querySelectorAll(".comment-form").forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const postId = Number(form.getAttribute("data-post-id"));
        const commentInput = form.querySelector("input");
        const commentText = commentInput.value.trim();

        if (commentText) {
          addComment(postId, commentText);
        }
      });
    });
  }

  function addComment(postId, text) {
    savedPosts = savedPosts.map(p => {
      if (p.id === postId) {
        p.comments.push(text);
      }
      return p;
    });
    localStorage.setItem("inktat_posts", JSON.stringify(savedPosts));
    renderPosts(savedPosts);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
});

// Curated News Feed Function
function loadTattooNews() {
  const newsContainer = document.getElementById("news-container");
  
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
