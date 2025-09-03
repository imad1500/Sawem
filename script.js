const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

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

    if (!response.ok) {
      throw new Error("Erreur serveur lors de la recherche");
    }

    const products = await response.json();

    if (!products || products.length === 0) {
      productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
      return;
    }

    productsContainer.innerHTML = products
      .map(
        (p) => `
      <div class="product-card">
        <img src="${p.image}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p class="price">${p.price}</p>
        <a href="${p.link}" target="_blank" class="btn view-btn">Voir</a>
        <button class="btn vote-btn">Voter</button>
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error(err);
    productsContainer.innerHTML = "<p>❌ Erreur serveur.</p>";
  }
});

// Optionnel: activer la recherche avec Enter
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});
