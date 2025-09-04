// script.js

const backendUrl = "https://sawem-backend.onrender.com";

// ==================== Google Login ====================
const googleLoginBtn = document.getElementById("googleLoginBtn");
let currentUser = null;

// Vérifie si un utilisateur est déjà en session
async function checkSession() {
  try {
    const res = await fetch(`${backendUrl}/auth/session`, {
      credentials: "include"
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        currentUser = data.user;
        updateLoginButton();
      }
    }
  } catch (err) {
    console.error("Erreur vérification session:", err);
  }
}

// Redirige vers Google OAuth
googleLoginBtn.addEventListener("click", () => {
  if (!currentUser) {
    window.location.href = `${backendUrl}/auth/google`;
  }
});

function updateLoginButton() {
  if (currentUser) {
    googleLoginBtn.textContent = `👤 ${currentUser.name}`;
    googleLoginBtn.disabled = true;
  }
}

// ==================== Produits ====================
const productsContainer = document.getElementById("productsContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

async function fetchProducts(query = "") {
  try {
    productsContainer.innerHTML = "<p>⏳ Chargement...</p>";
    const res = await fetch(`${backendUrl}/search?q=${encodeURIComponent(query)}`);
    const products = await res.json();

    if (products.length === 0) {
      productsContainer.innerHTML = "<p>Aucun produit trouvé.</p>";
      return;
    }

    renderProducts(products);
  } catch (err) {
    console.error("Erreur chargement produits:", err);
    productsContainer.innerHTML = "<p>❌ Erreur lors du chargement.</p>";
  }
}

function renderProducts(products) {
  productsContainer.innerHTML = "";
  const grid = document.createElement("div");
  grid.classList.add("product-grid");

  products.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="price">${product.price} €</p>
        <div class="stars">${renderStars(product.rating)}</div>
        <div class="product-actions">
          <a href="${product.url}" class="view-btn" target="_blank">Voir</a>
          <button class="vote-btn" data-id="${product.id}">👍 Vote</button>
        </div>
      </div>
      <div class="reviews-section">
        <div class="reviews-list" id="reviews-${product.id}">
          ${(product.reviews || []).map(r => `
            <div class="single-review">
              <div class="rev-head">
                <span>${r.user_name}</span>
                <span>${new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <div class="rev-body">${r.comment}</div>
            </div>
          `).join("")}
        </div>
        <textarea id="reviewInput-${product.id}" placeholder="Écrire un avis..."></textarea>
        <button class="send-review" data-product="${product.id}">Envoyer</button>
      </div>
    `;

    grid.appendChild(card);
  });

  productsContainer.appendChild(grid);

  // Attacher les événements après affichage
  document.querySelectorAll(".vote-btn").forEach(btn => {
    btn.addEventListener("click", () => voteProduct(btn.dataset.id));
  });

  document.querySelectorAll(".send-review").forEach(btn => {
    btn.addEventListener("click", () => sendReview(btn.dataset.product));
  });
}

function renderStars(rating) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push('<span class="star full">★</span>');
    else if (rating >= i - 0.5) stars.push('<span class="star half">★</span>');
    else stars.push('<span class="star empty">☆</span>');
  }
  return stars.join("");
}

// ==================== Votes ====================
async function voteProduct(productId) {
  try {
    if (!currentUser) {
      alert("Veuillez vous connecter pour voter.");
      return;
    }
    const res = await fetch(`${backendUrl}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId })
    });
    if (res.ok) {
      alert("✅ Vote enregistré !");
    }
  } catch (err) {
    console.error("Erreur vote:", err);
  }
}

// ==================== Avis ====================
async function sendReview(productId) {
  try {
    if (!currentUser) {
      alert("Veuillez vous connecter pour laisser un avis.");
      return;
    }
    const input = document.getElementById(`reviewInput-${productId}`);
    const comment = input.value.trim();
    if (!comment) {
      alert("Veuillez écrire un avis.");
      return;
    }

    const res = await fetch(`${backendUrl}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId, comment })
    });

    if (res.ok) {
      const newReview = await res.json();
      const reviewsList = document.getElementById(`reviews-${productId}`);
      reviewsList.innerHTML += `
        <div class="single-review">
          <div class="rev-head">
            <span>${currentUser.name}</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div class="rev-body">${newReview.comment}</div>
        </div>
      `;
      input.value = "";
    }
  } catch (err) {
    console.error("Erreur ajout avis:", err);
  }
}

// ==================== Recherche ====================
searchBtn.addEventListener("click", () => {
  fetchProducts(searchInput.value);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchProducts(searchInput.value);
});

// ==================== Init ====================
checkSession();
fetchProducts();
