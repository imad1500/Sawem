// script.js - frontend logic
// Remplace BACKEND_URL si besoin (par exemple si tu veux utiliser local)
const BACKEND_URL = "https://sawem-backend.onrender.com"; // change if needed

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

// Render stars (HTML with classes .star.full / .half / .empty)
function renderStarsHTML(rating) {
  const r = Number(rating || 0);
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= full) html += '<span class="star full">★</span>';
    else if (half && i === full + 1) html += '<span class="star half">★</span>';
    else html += '<span class="star empty">★</span>';
  }
  return html;
}

// Create product card HTML (keeps classes from style.css)
function productCardHTML(p) {
  const safePrice = p.price || "";
  const safeTitle = p.title || "";
  const ratingNum = Number(p.user_rating || 0);
  const starsHTML = renderStarsHTML(ratingNum);
  return `
    <div class="product-card">
      <img src="${p.image || 'https://via.placeholder.com/400x300'}" alt="${escapeHtml(safeTitle)}" />
      <div class="product-info">
        <h3>${escapeHtml(safeTitle)}</h3>
        <p class="price">${escapeHtml(safePrice)}</p>
        <p class="stars">Vote: ${starsHTML} <span class="rating">(${ratingNum.toFixed(1)})</span></p>
        <div class="product-actions">
          <a class="view-btn" href="${p.link || '#'}" target="_blank" rel="noopener">Voir</a>
          <button class="vote-btn" onclick="promptVote(${p.id})">Voter</button>
        </div>
        <div class="reviews-section">
          <textarea id="review-${p.id}" placeholder="Votre avis..." rows="3"></textarea>
          <button onclick="submitReview(${p.id})">Envoyer</button>
        </div>
      </div>
    </div>
  `;
}

// Escape HTML helpers
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"\'":'&#39;'})[m];
  });
}

// Display products separated vertically: AliExpress then Amazon
function displayProducts(products) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
    return;
  }

  const ali = products.filter(p => (p.source || "").toLowerCase().includes("aliexpress"));
  const amazon = products.filter(p => (p.source || "").toLowerCase().includes("amazon"));
  const others = products.filter(p => {
    const s = (p.source || "").toLowerCase();
    return !s.includes("aliexpress") && !s.includes("amazon");
  });

  let html = "";

  if (ali.length) {
    html += `<div class="source-block"><h2 class="source-title">AliExpress</h2><div class="product-grid">`;
    html += ali.map(productCardHTML).join("");
    html += `</div></div>`;
  }

  if (amazon.length) {
    html += `<div class="source-block"><h2 class="source-title">Amazon</h2><div class="product-grid">`;
    html += amazon.map(productCardHTML).join("");
    html += `</div></div>`;
  }

  if (others.length) {
    html += `<div class="source-block"><h2 class="source-title">Autres</h2><div class="product-grid">`;
    html += others.map(productCardHTML).join("");
    html += `</div></div>`;
  }

  productsContainer.innerHTML = html;
}

// Load initial products
async function loadInitialProducts() {
  productsContainer.innerHTML = "<p>⏳ Chargement des produits...</p>";
  try {
    const res = await fetch(`${BACKEND_URL}/products`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    displayProducts(data);
  } catch (err) {
    console.error("loadInitialProducts error:", err);
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${escapeHtml(err.message || err)}</p>`;
  }
}

// Search (semantic) - POST /search
async function searchProducts(query) {
  productsContainer.innerHTML = "<p>⏳ Recherche en cours...</p>";
  try {
    const res = await fetch(`${BACKEND_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Erreur serveur");
    }
    const data = await res.json();
    // server returns an array of products
    displayProducts(data);
  } catch (err) {
    console.error("searchProducts error:", err);
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${escapeHtml(err.message || err)}</p>`;
  }
}

// Event handlers: search button
searchBtn.addEventListener("click", () => {
  const q = (searchInput.value || "").trim();
  if (!q) {
    loadInitialProducts();
  } else {
    searchProducts(q);
  }
});

// Voting prompt
async function promptVote(productId) {
  const input = prompt("Donnez une note entre 1 et 5 (entier) :");
  if (!input) return;
  const stars = Number(input);
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return alert("Note invalide (1-5)");
  }
  try {
    const res = await fetch(`${BACKEND_URL}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, stars })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    alert("Merci ! Note mise à jour.");
    // refresh products to reflect new rating
    const q = (searchInput.value || "").trim();
    if (q) searchProducts(q); else loadInitialProducts();
  } catch (err) {
    console.error("promptVote error:", err);
    alert("Erreur lors du vote");
  }
}

// Submit review
async function submitReview(productId) {
  const textarea = document.getElementById(`review-${productId}`);
  if (!textarea) return;
  const comment = textarea.value.trim();
  if (!comment) return alert("Écrivez un commentaire.");
  try {
    const res = await fetch(`${BACKEND_URL}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, comment })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    alert("Merci pour votre avis !");
    textarea.value = "";
  } catch (err) {
    console.error("submitReview error:", err);
    alert("Erreur lors de l'envoi de l'avis");
  }
}

// Init
loadInitialProducts();
