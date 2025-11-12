import { Router } from "express";
import Sale from "../models/Sale";
import { getTotalSales } from "../utils/getTotalSales";
import { getMonthlySales } from "../utils/getMonthlySales";
import { getSalesByCountry } from "../utils/getSalesByCountry";
import { getLastTransactions } from "../utils/getLastTransactions";
import { getSales } from "../utils/getSales";

const router = Router();

// GET — всі продажі з пагінацією
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const sortField = req.query.sortField as string;
    const sortOrder = parseInt(req.query.sortOrder as string);
    const filtersRaw = req.query.filters as string;

    const result = await getSales({
      page,
      limit,
      sortField,
      sortOrder,
      filtersRaw,
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET - сума всіх продажів
router.get("/totalSales", async (req, res) => {
  try {
    const totalSales = await getTotalSales();
    res.json({ totalSales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate total sales" });
  }
});

// GET - кількість продажів по місячно
router.get("/monthlySales", async (req, res) => {
  try {
    const monthlySales = await getMonthlySales();
    res.json({ monthlySales });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate monthly sales" });
  }
});

// GET - продажі по країнам
router.get("/salesByCountry", async (req, res) => {
  try {
    const salesByCountry = await getSalesByCountry();
    res.json({ salesByCountry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate sales by country" });
  }
});

// GET - 10 останніх транзакцій
router.get("/lastTransactions", async (req, res) => {
  try {
    const lastTransactions = await getLastTransactions();
    res.json({ lastTransactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate last transactions" });
  }
});

// GET — аналітика: продажі за продуктами
router.get("/analytics/products", async (req, res) => {
  try {
    const data = await Sale.aggregate([
      {
        $group: {
          _id: "$productId",
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST — додати продаж
router.post("/", async (req, res) => {
  try {
    const sale = new Sale(req.body);
    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
