// script.js - frontend
const BACKEND_URL = "https://sawem-backend.onrender.com"; 

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");
const googleLoginBtn = document.getElementById("googleLoginBtn");

// ==================== Gestion des paramètres URL ====================
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    auth: params.get('auth'),
    error: params.get('error')
  };
}

// ==================== Utilitaires ====================
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

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

function renderReviewsList(reviews) {
  if (!reviews || !reviews.length) return `<div class="reviews-list-empty">Aucun avis</div>`;
  return reviews.map(r => `
    <div class="single-review">
      <div class="rev-head"><strong>${escapeHtml(r.user_name || 'Anonyme')}</strong>
        <span class="rev-date">${new Date(r.created_at).toLocaleString()}</span>
      </div>
      <div class="rev-body">${escapeHtml(r.comment)}</div>
    </div>
  `).join("");
}

// ==================== Notifications ====================
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    z-index: 1000;
    font-weight: bold;
    animation: slideIn 0.3s ease-out;
  `;
  
  if (type === 'success') {
    notification.style.backgroundColor = '#4CAF50';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#f44336';
  } else {
    notification.style.backgroundColor = '#2196F3';
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// ==================== Produits ====================
function productCardHTML(p) {
  const title = escapeHtml(p.title || "");
  const price = escapeHtml(p.price || "");
  const link = p.link || "#";
  const ratingNum = Number(p.user_rating || 0);
  const starsHTML = renderStarsHTML(ratingNum);
  const reviewsHTML = renderReviewsList(p.reviews || []);

  return `
    <div class="product-card" data-id="${p.id}">
      <img src="${p.image || 'https://via.placeholder.com/400x300'}" alt="${title}" />
      <div class="product-info">
        <h3>${title}</h3>
        <p class="price">${price}</p>
        <p class="stars">Vote: ${starsHTML} <span class="rating">(${ratingNum.toFixed(1)})</span></p>
        <div class="product-actions">
          <a class="view-btn" href="${escapeHtml(link)}" target="_blank" rel="noopener">Voir</a>
          <button class="vote-btn" onclick="promptVote(${p.id})">Voter</button>
        </div>

        <div class="reviews-section">
          <div id="reviews-list-${p.id}" class="reviews-list">${reviewsHTML}</div>
          <textarea id="review-${p.id}" placeholder="Votre avis..." rows="3"></textarea>
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

  const ali = products.filter(p => (p.source||"").toLowerCase().includes("aliexpress"));
  const amazon = products.filter(p => (p.source||"").toLowerCase().includes("amazon"));
  const others = products.filter(p => {
    const s = (p.source||"").toLowerCase();
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

// ==================== Chargement initial ====================
async function loadInitialProducts() {
  productsContainer.innerHTML = "<p>⏳ Chargement des produits...</p>";
  try {
    const res = await fetch(`${BACKEND_URL}/products`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    displayProducts(data);
  } catch (err) {
    console.error("loadInitialProducts error:", err);
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${escapeHtml(err.message||err)}</p>`;
  }
}

// ==================== Recherche ====================
async function searchProducts(q) {
  if (!q || !q.trim()) return loadInitialProducts();
  productsContainer.innerHTML = "<p>⏳ Recherche en cours...</p>";
  try {
    const res = await fetch(`${BACKEND_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    displayProducts(data);
  } catch (err) {
    console.error("searchProducts error:", err);
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${escapeHtml(err.message||err)}</p>`;
  }
}

// ==================== Vote ====================
async function promptVote(productId) {
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
    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 401) {
        showNotification("Vous devez être connecté pour voter", "error");
        return;
      }
      throw new Error(errorText);
    }
    await res.json();
    showNotification("Vote enregistré avec succès!", "success");
    const q = (searchInput.value||"").trim();
    if (q) searchProducts(q); else loadInitialProducts();
  } catch (err) {
    console.error("promptVote error:", err);
    showNotification("Erreur lors du vote", "error");
  }
}

// ==================== Reviews ====================
async function submitReview(productId) {
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
    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 401) {
        showNotification("Vous devez être connecté pour laisser un avis", "error");
        return;
      }
      throw new Error(errorText);
    }
    const data = await res.json();
    showNotification("Avis ajouté avec succès!", "success");
    if (data && Array.isArray(data.reviews)) {
      const list = document.getElementById(`reviews-list-${productId}`);
      if (list) list.innerHTML = renderReviewsList(data.reviews);
    } else {
      const q = (searchInput.value||"").trim();
      if (q) searchProducts(q); else loadInitialProducts();
    }
    ta.value = "";
  } catch (err) {
    console.error("submitReview error:", err);
    showNotification("Erreur lors de l'envoi de l'avis", "error");
  }
}

// ==================== User Google ====================
let currentUser = null;

async function checkUser() {
  try {
    const res = await fetch(`${BACKEND_URL}/me`, { credentials: 'include' });
    if (!res.ok) throw new Error("Not logged in");
    const data = await res.json();
    currentUser = data.user;
    
    // Mise à jour de l'interface utilisateur
    updateLoginButton(true, data.user.name);
    
    // Vérifier les paramètres URL pour les messages d'authentification
    const urlParams = getUrlParams();
    if (urlParams.auth === 'success') {
      showNotification(`Connexion réussie! Bienvenue ${data.user.name}`, "success");
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
  } catch (err) {
    currentUser = null;
    updateLoginButton(false);
    
    // Vérifier les erreurs d'authentification dans l'URL
    const urlParams = getUrlParams();
    if (urlParams.error === 'auth_failed') {
      showNotification("Erreur lors de la connexion Google", "error");
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

function updateLoginButton(isLoggedIn, userName = '') {
  if (isLoggedIn) {
    googleLoginBtn.textContent = `Bonjour ${userName} - Déconnexion`;
    googleLoginBtn.href = "#";
    googleLoginBtn.onclick = logout;
  } else {
    googleLoginBtn.textContent = "Se connecter avec Google";
    googleLoginBtn.href = `${BACKEND_URL}/auth/google`;
    googleLoginBtn.onclick = null;
  }
}

async function logout() {
  try {
    const res = await fetch(`${BACKEND_URL}/logout`, {
      method: "POST",
      credentials: "include"
    });
    
    if (res.ok) {
      currentUser = null;
      updateLoginButton(false);
      showNotification("Déconnexion réussie!", "success");
    } else {
      throw new Error("Erreur lors de la déconnexion");
    }
  } catch (err) {
    console.error("Logout error:", err);
    showNotification("Erreur lors de la déconnexion", "error");
  }
}

// ==================== Events ====================
searchBtn.addEventListener("click", () => {
  const q = (searchInput.value||"").trim();
  searchProducts(q);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const q = (searchInput.value||"").trim();
    searchProducts(q);
  }
});

// ==================== Init ====================
// Ajouter les styles CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Initialisation
checkUser();
loadInitialProducts();
