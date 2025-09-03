// === Dépendances ===
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "pg";
import fetch from "node-fetch";

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// === Connexion BDD ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// === JINA AI ===
const JINA_API_KEY = process.env.JINA_API_KEY;

async function getEmbedding(text) {
  const response = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JINA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jina-embeddings-v2-base-en",
      input: [text],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jina AI error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const fullEmbedding = data.data[0].embedding;
  return fullEmbedding.slice(0, 384);
}

// === Charger produits (AliExpress -> Amazon) ===
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM products ORDER BY 
        CASE WHEN source ILIKE '%aliexpress%' THEN 1 ELSE 2 END, id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Recherche via embeddings ===
app.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query manquante" });

    const embedding = await getEmbedding(query);

    const sql = `
      SELECT *, embedding <=> $1::vector AS distance
      FROM products
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT 50
    `;
    const result = await pool.query(sql, [JSON.stringify(embedding)]);
    const THRESHOLD = 0.95;
    const filtered = result.rows.filter((r) => r.distance < THRESHOLD);

    // Réorganiser AliExpress puis Amazon
    const aliexpress = filtered.filter(p => p.source.toLowerCase().includes("aliexpress"));
    const amazon = filtered.filter(p => p.source.toLowerCase().includes("amazon"));

    res.json([...aliexpress, ...amazon]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Ajouter un vote ===
app.post("/vote", async (req, res) => {
  try {
    const { product_id, user_id, stars } = req.body;
    if (!product_id || !user_id || !stars) return res.status(400).json({ error: "Données manquantes" });

    await pool.query(
      `INSERT INTO ratings(product_id, user_name, stars, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (product_id, user_name) DO UPDATE SET stars = $3`,
      [product_id, user_id, stars]
    );

    // Recalculer note moyenne
    const result = await pool.query(
      `SELECT AVG(stars) AS avg_rating FROM ratings WHERE product_id = $1`,
      [product_id]
    );

    await pool.query(
      `UPDATE products SET user_rating = $1 WHERE id = $2`,
      [result.rows[0].avg_rating || 0, product_id]
    );

    res.json({ success: true, avg_rating: result.rows[0].avg_rating || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Ajouter un review ===
app.post("/review", async (req, res) => {
  try {
    const { product_id, user_id, comment } = req.body;
    if (!product_id || !user_id || !comment) return res.status(400).json({ error: "Données manquantes" });

    await pool.query(
      `INSERT INTO reviews(product_id, user_id, comment, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [product_id, user_id, comment]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Récupérer les reviews d'un produit ===
app.get("/reviews/:product_id", async (req, res) => {
  try {
    const { product_id } = req.params;
    const result = await pool.query(
      `SELECT r.comment, u.name, r.created_at
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [product_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Root ===
app.get("/", (req, res) => {
  res.send("🚀 Sawem-backend opérationnel avec recherche embeddings, votes et reviews");
});

// === Lancer serveur ===
app.listen(port, () => {
  console.log(`✨ Serveur lancé sur http://localhost:${port}`);
});
