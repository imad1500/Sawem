const backendURL = "https://sawem-backend.onrender.com";

const searchInput = document.getElementById("search");
const productsDiv = document.getElementById("products");
const errorMsg = document.getElementById("error");

// Fonction pour charger les produits
async function loadProducts(query = "tech") {
  try {
    errorMsg.classList.add("hidden");
    productsDiv.innerHTML = "⏳ Chargement...";

    const response = await fetch(`${backendURL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Erreur API");
    }

    const products = await response.json();

    if (!products.length) {
      productsDiv.innerHTML = "<p>Aucun produit trouvé.</p>";
      return;
    }

    productsDiv.innerHTML = "";
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.title}" />
        <h3>${p.title}</h3>
        <a href="${p.url}" target="_blank">Voir sur ${
          p.url.includes("aliexpress") ? "Aliexpress" : "Amazon"
        }</a>
      `;
      productsDiv.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    productsDiv.innerHTML = "";
    errorMsg.classList.remove("hidden");
  }
}

// Recherche dynamique
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    loadProducts(searchInput.value);
  }
});

// Charger par défaut
loadProducts();
