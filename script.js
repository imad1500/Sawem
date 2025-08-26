let products = [];

// Charger les produits
fetch('products.json')
  .then(response => response.json())
  .then(data => {
    products = data;
    displayProducts(products);
  })
  .catch(err => console.error("Erreur chargement products.json :", err));

const searchBox = document.getElementById('searchBox');
const amazonContainer = document.getElementById('amazon-products');
const aliContainer = document.getElementById('aliexpress-products');

// Recherche en temps réel
searchBox.addEventListener('input', () => {
  const query = searchBox.value.trim().toLowerCase();
  const filtered = products.filter(p => p.title.toLowerCase().includes(query));
  displayProducts(filtered);
});

function displayProducts(list) {
  amazonContainer.innerHTML = '';
  aliContainer.innerHTML = '';

  if (list.length === 0) {
    amazonContainer.innerHTML = '<p>Aucun produit trouvé.</p>';
    aliContainer.innerHTML = '';
    return;
  }

  list.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p class="price">${product.price}</p>
      <a href="${product.link}" target="_blank" class="btn">Voir le produit</a>
    `;

    if (product.source === "Amazon") amazonContainer.appendChild(card);
    else if (product.source === "AliExpress") aliContainer.appendChild(card);
  });
}
