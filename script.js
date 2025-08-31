// URL de ton service web embeddings
const EMBEDDING_URL = "https://sawem-embedding8.onrender.com/embed";

// Bouton pour générer embeddings et récupérer recommandations
document.getElementById("embedBtn").addEventListener("click", async () => {
  const text = document.getElementById("inputText").value.trim();
  const resultEl = document.getElementById("result");

  if (!text) {
    resultEl.textContent = "Veuillez entrer une description pour la recherche.";
    return;
  }

  resultEl.textContent = "Chargement des recommandations...";

  try {
    const response = await fetch(EMBEDDING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);

    const data = await response.json();

    // Ici tu peux appeler ta fonction pour rechercher dans ta DB en utilisant l'embedding
    // Par exemple : searchProducts(data.embedding)
    resultEl.textContent = JSON.stringify(data, null, 2);

  } catch (err) {
    resultEl.textContent = `Erreur: ${err.message}`;
  }
});
