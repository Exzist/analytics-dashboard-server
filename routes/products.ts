import { Router } from "express";
import Product from "../models/Product";
import { getTopProducts } from "../utils/getTopProducts";

const router = Router();

// GET — всі продукти
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET - топ 5 продуктів за продажами
router.get("/topProducts", async (req, res) => {
  try {
    const topProducts = await getTopProducts();
    res.json(topProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate top products" });
  }
});

// POST — додати новий продукт
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
