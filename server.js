import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("gymz");
    console.log("Connesso a MongoDB Atlas");
  } catch (err) {
    console.error("Errore di connessione a MongoDB:", err);
  }
}
connectDB();

/* ---------- FIND ---------- */
app.post("/action/find", async (req, res) => {
  const { collection, filter = {} } = req.body;
  if (!collection)
    return res.status(400).json({ error: "Collection mancante" });

  try {
    const result = await db.collection(collection).find(filter).toArray();
    res.json({ documents: result });
  } catch (err) {
    console.error("Errore in /action/find:", err);
    res.status(500).json({ error: "Errore durante la ricerca" });
  }
});

/* ---------- AGGREGATE ---------- */
app.post("/action/aggregate", async (req, res) => {
  const { collection, pipeline = [] } = req.body;
  if (!collection || !Array.isArray(pipeline))
    return res.status(400).json({ error: "Collection o pipeline non valida" });

  try {
    const result = await db
      .collection(collection)
      .aggregate(pipeline)
      .toArray();
    res.json({ documents: result });
  } catch (err) {
    console.error("Errore in /action/aggregate:", err);
    res.status(500).json({ error: "Errore durante l'aggregazione" });
  }
});

/* ---------- UPDATE ONE ---------- */
app.post("/action/updateOne", async (req, res) => {
  const { collection, filter, update } = req.body;
  if (!collection || !filter || !update)
    return res
      .status(400)
      .json({ error: "Collection, filter o update mancanti" });

  try {
    const result = await db
      .collection(collection)
      .updateOne(filter, update, { upsert: true });

    const created = !!result.upsertedId;
    const updated = result.modifiedCount > 0;

    res.json({
      success: true,
      created,
      updated,
      upsertedId: result.upsertedId ?? null,
    });
  } catch (err) {
    console.error("Errore in /action/updateOne:", err);
    res.status(500).json({ error: "Errore durante l'update" });
  }
});

/* ---------- SERVER START ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server avviato sulla porta ${PORT}`));
