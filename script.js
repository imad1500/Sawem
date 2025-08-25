// Charger les produits depuis products.json
let products = [];

fetch('products.json')
  .then(response => response.json())
  .then(data => {
    products = data;
    displayProducts(products); // Afficher tous les produits au départ
  })
  .catch(error => console.error('Erreur chargement products.json :', error));

// Référence aux éléments
const searchBox = document.getElementById('searchBox');
const searchBtn = document.getElementById('searchBtn');
const results = document.getElementById('results');

// Événement clic sur le bouton Rechercher
searchBtn.addEventListener('click', () => {
  const query = searchBox.value.trim().toLowerCase();
  const filtered = products.filter(product =>
    product.title.toLowerCase().includes(query)
  );
  displayProducts(filtered);
});

// Événement recherche en temps réel quand on tape dans la barre
searchBox.addEventListener('input', () => {
  const query = searchBox.value.trim().toLowerCase();
  const filtered = products.filter(product =>
    product.title.toLowerCase().includes(query)
  );
  displayProducts(filtered);
});

// Fonction pour afficher les produits
function displayProducts(list) {
  results.innerHTML = '';

  if (list.length === 0) {
    results.innerHTML = '<p>Aucun produit trouvé.</p>';
    return;
  }

  list.forEach(product => {
    const card = document.createElement('div');
    card.classList.add('card');

    // Image
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.title;
    card.appendChild(img);

    // Titre
    const title = document.createElement('h3');
    title.textContent = product.title;
    card.appendChild(title);

    // Prix en orange
    const price = document.createElement('span');
    price.classList.add('price');
    price.textContent = product.price;
    card.appendChild(price);

    // Lien
    const link = document.createElement('a');
    link.href = product.link;
    link.target = '_blank';
    link.textContent = 'Voir sur Amazon';
    card.appendChild(link);

    results.appendChild(card);
  });
}
