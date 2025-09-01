const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchInput = document.getElementById("searchBox");

let products = [];

async function fetchProducts() {
  const res = await fetch("https://ton-backend.onrender.com/products");
  products = await res.json();
  displayProducts(products);
}

function formatPrice(price, source) {
  if (source.toLowerCase() === "amazon") return price + " $";
  if (source.toLowerCase() === "aliexpress") return price.replace("?", "€");
  return price;
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <img src="${product.image}" alt="${product.title}">
    <h3>${product.title}</h3>
    <p class="price">${formatPrice(product.price, product.source)}</p>
    <p class="score">⭐ Note moyenne : ${product.user_rating || 0}</p>
    <input type="number" min="1" max="5" class="vote-input" placeholder="Vote (1-5)">
    <button class="vote-btn">Voter</button>
    <a href="${product.link}" target="_blank" class="btn">Voir le produit</a>
  `;
  const voteBtn = card.querySelector(".vote-btn");
  const voteInput = card.querySelector(".vote-input");
  const scoreElem = card.querySelector(".score");

  voteBtn.addEventListener("click", async () => {
    const stars = parseInt(voteInput.value);
    if (!stars || stars < 1 || stars > 5) return alert("Entrez une note valide (1-5)");

    const res = await fetch("https://ton-backend.onrender.com/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, stars })
    });
    const data = await res.json();
    if (data.score) {
      product.user_rating = data.score;
      scoreElem.textContent = `⭐ Note moyenne : ${data.score}`;
      voteInput.value = "";
      displayProducts(products);
    }
  });

  return card;
}

function displayProducts(list) {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  list.forEach(product => {
    const card = createProductCard(product);
    if (product.source.toLowerCase() === "amazon") amazonContainer.appendChild(card);
    else if (product.source.toLowerCase() === "aliexpress") aliContainer.appendChild(card);
  });
}

searchInput.addEventListener("input", async (e) => {
  const term = e.target.value.trim();
  if (!term) return displayProducts(products);

  const res = await fetch(`https://ton-backend.onrender.com/search?term=${encodeURIComponent(term)}`);
  const searchResults = await res.json();
  displayProducts(searchResults);
});

fetchProducts();
