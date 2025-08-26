let products = [];

// Charger les produits depuis products.json
fetch('products.json')
  .then(response => response.json())
  .then(data => {
    products = data;
    displayProducts(products);
  })
  .catch(error => console.error('Erreur chargement products.json :', error));

// Références aux éléments
const searchBox = document.getElementById('searchBox');
const searchBtn = document.getElementById('searchBtn');
const amazonContainer = document.getElementById('amazon-products');
const aliContainer = document.getElementById('aliexpress-products');

// Fonction pour afficher les produits
function displayProducts(list) {
  amazonContainer.innerHTML = '';
  aliContainer.innerHTML = '';

  const filteredAli = list.filter(p => p.source === "AliExpress");
  const filteredAmazon = list.filter(p => p.source === "Amazon");

  if (filteredAli.length === 0 && filteredAmazon.length === 0) {
    aliContainer.innerHTML = '<p>Aucun produit trouvé.</p>';
    return;
  }

  filteredAli.forEach(product => createCard(product, aliContainer));
  filteredAmazon.forEach(product => createCard(product, amazonContainer));
}

// Fonction pour créer une carte produit
function createCard(product, container) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <img src="${product.image}" alt="${product.title}">
    <h3>${product.title}</h3>
    <p class="price">${product.price}</p>
    <a href="${product.link}" target="_blank" class="btn">Voir le produit</a>
  `;
  container.appendChild(card);
}

// Recherche en temps réel
searchBox.addEventListener('input', () => {
  const query = searchBox.value.trim().toLowerCase();
  const filtered = products.filter(p => p.title.toLowerCase().includes(query));
  displayProducts(filtered);
});

// Recherche au clic sur le bouton
searchBtn.addEventListener('click', () => {
  const query = searchBox.value.trim().toLowerCase();
  const filtered = products.filter(p => p.title.toLowerCase().includes(query));
  displayProducts(filtered);
});
