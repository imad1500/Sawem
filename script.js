// script.js - frontend fonctionnel complet
const BACKEND_URL = "https://sawem-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const productsContainer = document.getElementById("productsContainer");
  const googleLoginBtn = document.getElementById("googleLoginBtn");

  // ===== Utilitaires =====
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
  }

  function renderStars(rating) {
    const r = Number(r || 0);
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

  function renderReviews(reviews) {
    if (!reviews || !reviews.length) return `<div>Aucun avis</div>`;
    return reviews.map(r => `
      <div class="single-review">
        <div><strong>${escapeHtml(r.user_name||"Anonyme")}</strong> - <small>${new Date(r.created_at).toLocaleString()}</small></div>
        <div>${escapeHtml(r.comment)}</div>
      </div>
    `).join("");
  }

  function productCardHTML(p) {
    return `
      <div class="product-card" data-id="${p.id}">
        <img src="${p.image||'https://via.placeholder.com/400x300'}" alt="${escapeHtml(p.title)}">
        <div class="product-info">
          <h3>${escapeHtml(p.title)}</h3>
          <p class="price">${escapeHtml(p.price)}</p>
          <p class="stars">${renderStars(p.user_rating)} (${p.user_rating.toFixed(1)})</p>
          <div class="product-actions">
            <a href="${p.link}" target="_blank" class="view-btn">Voir</a>
            <button class="vote-btn" onclick="promptVote(${p.id})">Voter</button>
          </div>
          <div class="reviews-section">
            <div id="reviews-list-${p.id}" class="reviews-list">${renderReviews(p.reviews)}</div>
            <textarea id="review-${p.id}" placeholder="Votre avis..." rows="2"></textarea>
            <button onclick="submitReview(${p.id})">Envoyer</button>
          </div>
        </div>
      </div>
    `;
  }

  function displayProducts(products) {
    if (!products || !products.length) {
      productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
      return;
    }
    productsContainer.innerHTML = products.map(productCardHTML).join("");
  }

  // ===== Chargement initial =====
  async function loadInitialProducts() {
    productsContainer.innerHTML = "<p>⏳ Chargement des produits...</p>";
    try {
      const res = await fetch(`${BACKEND_URL}/products`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      displayProducts(data);
    } catch (err) {
      console.error("Erreur chargement produits:", err);
      productsContainer.innerHTML = `<p>❌ Erreur serveur: ${escapeHtml(err.message)}</p>`;
    }
  }

  // ===== Recherche =====
  async function searchProducts(query) {
    if (!query || !query.trim()) return loadInitialProducts();
    productsContainer.innerHTML = "<p>⏳ Recherche en cours...</p>";
    try {
      const res = await fetch(`${BACKEND_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      displayProducts(data);
    } catch (err) {
      console.error("Erreur recherche:", err);
      productsContainer.innerHTML = `<p>❌ ${escapeHtml(err.message)}</p>`;
    }
  }

  searchBtn.addEventListener("click", () => {
    searchProducts(searchInput.value.trim());
  });

  // ===== Vote =====
  window.promptVote = async function(productId) {
    const input = prompt("Note (1-5) :");
    if (!input) return;
    const stars = Number(input);
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) return alert("Note invalide");
    try {
      const res = await fetch(`${BACKEND_URL}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId, stars })
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      const q = searchInput.value.trim();
      if (q) searchProducts(q); else loadInitialProducts();
    } catch (err) {
      console.error("Erreur vote:", err);
      alert("Erreur lors du vote");
    }
  }

  // ===== Avis =====
  window.submitReview = async function(productId) {
    const ta = document.getElementById(`review-${productId}`);
    if (!ta) return;
    const comment = ta.value.trim();
    if (!comment) return alert("Écrivez un commentaire");
    try {
      const res = await fetch(`${BACKEND_URL}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId, comment })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data && Array.isArray(data.reviews)) {
        const list = document.getElementById(`reviews-list-${productId}`);
        if (list) list.innerHTML = renderReviews(data.reviews);
      }
      ta.value = "";
    } catch (err) {
      console.error("Erreur avis:", err);
      alert("Erreur lors de l'envoi de l'avis");
    }
  }

  // ===== Google Login / Check user =====
  async function checkUser() {
    try {
      const res = await fetch(`${BACKEND_URL}/me`, { credentials: 'include' });
      if (!res.ok) throw new Error("Non connecté");
      const data = await res.json();
      if (data.user) {
        googleLoginBtn.textContent = `Connecté: ${data.user.name}`;
        googleLoginBtn.href = "#";
      } else throw new Error();
    } catch {
      googleLoginBtn.textContent = "Se connecter avec Google";
      googleLoginBtn.href = `${BACKEND_URL}/auth/google`;
    }
  }

  checkUser();
  loadInitialProducts();
});
