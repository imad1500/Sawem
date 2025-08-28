const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchBox = document.getElementById("searchBox");

let products = [];

// Récupérer les produits depuis le backend
async function fetchProducts() {
  try {
    const res = await fetch("http://localhost:5000/products");
    products = await res.json();
    displayProducts(products);
  } catch (err) {
    console.error("Erreur récupération produits :", err);
  }
}

// Affichage des produits
function displayProducts(items) {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p class="price">${p.price}</p>
      <p class="score">⭐ ${p.user_rating ? p.user_rating.toFixed(1) : "0"} / 5</p>
      <div class="vote">
        <input type="number" min="1" max="5" placeholder="Vote 1-5" class="vote-stars">
        <button class="vote-btn">Voter</button>
      </div>
      <a href="${p.link}" target="_blank" class="btn">Voir le produit</a>
    `;
    // Gestion du vote
    const voteBtn = card.querySelector(".vote-btn");
    const voteInput = card.querySelector(".vote-stars");
    voteBtn.addEventListener("click", async () => {
      const stars = parseInt(voteInput.value);
      if (!stars || stars < 1 || stars > 5) return alert("Entrez une note de 1 à 5");
      await fetch("http://localhost:5000/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: p.id, user_name: "Guest", stars, comment: "" })
      });
      fetchProducts(); // rafraîchir le score
    });

    if (p.source === "Amazon") amazonContainer.appendChild(card);
    if (p.source === "AliExpress") aliContainer.appendChild(card);
  });
}

// Recherche en temps réel
searchBox.addEventListener("input", () => {
  const term = searchBox.value.toLowerCase();
  const filtered = products.filter(p => p.title.toLowerCase().includes(term));
  displayProducts(filtered);
});

// Initialisation
fetchProducts();
