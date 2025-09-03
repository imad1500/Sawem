const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

// Fonction pour afficher les produits
function displayProducts(products) {
  if (!products || !products.length) {
    productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
    return;
  }

  // Séparer AliExpress et Amazon
  const aliProducts = products.filter(p => p.source.toLowerCase().includes("aliexpress"));
  const amazonProducts = products.filter(p => p.source.toLowerCase().includes("amazon"));

  const sections = [
    { title: "AliExpress", items: aliProducts },
    { title: "Amazon", items: amazonProducts },
  ];

  productsContainer.innerHTML = sections
    .map(section => {
      if (!section.items.length) return "";
      return `
        <h3>${section.title}</h3>
        <div class="products-container">
          ${section.items.map(p => `
            <div class="product-card">
              <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x200'"/>
              <div class="product-info">
                <h3>${p.title}</h3>
                <p>${p.price}</p>
                <div class="product-actions">
                  <a class="view-btn" href="${p.link}" target="_blank">Voir</a>
                  <button class="vote-btn" onclick="vote(${p.id})">
                    Vote (${Number(p.user_rating || 0).toFixed(1)})
                  </button>
                </div>
                <div class="reviews-section">
                  <textarea placeholder="Votre avis..." id="review-${p.id}"></textarea>
                  <button class="vote-btn" onclick="submitReview(${p.id})">Envoyer</button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }).join("");
}

// Fonction de vote
function vote(id) {
  const rating = prompt("Donnez une note entre 1 et 5 :");
  const stars = Number(rating);
  if (!stars || stars < 1 || stars > 5) return alert("Note invalide");

  fetch(`https://sawem-backend.onrender.com/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: id, stars }),
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Vote enregistré !");
      loadInitialProducts();
    })
    .catch(err => alert("Erreur vote: " + err.message));
}

// Fonction pour envoyer un commentaire
function submitReview(id) {
  const textarea = document.getElementById(`review-${id}`);
  const comment = textarea.value.trim();
  if (!comment) return alert("Veuillez écrire un commentaire.");

  fetch(`https://sawem-backend.onrender.com/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: id, comment }),
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Commentaire envoyé !");
      textarea.value = "";
      loadInitialProducts();
    })
    .catch(err => alert("Erreur commentaire: " + err.message));
}

// Recherche par Jina embeddings
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  productsContainer.innerHTML = "<p>⏳ Chargement des produits...</p>";

  try {
    const response = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error("Erreur serveur");

    const products = await response.json();
    displayProducts(products);

  } catch (err) {
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${err.message}</p>`;
  }
});

// Chargement initial de tous les produits
async function loadInitialProducts() {
  productsContainer.innerHTML = "<p>⏳ Chargement des produits...</p>";
  try {
    const response = await fetch("https://sawem-backend.onrender.com/products");
    if (!response.ok) throw new Error("Erreur serveur");

    const products = await response.json();
    displayProducts(products);
  } catch (err) {
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${err.message}</p>`;
  }
}

// Initial load
loadInitialProducts();
