import { Router } from "express";
import Sale from "../models/Sale";
import { getTotalSales } from "../utils/getTotalSales";
import { getMonthlySales } from "../utils/getMonthlySales";
import { getSalesByCountry } from "../utils/getSalesByCountry";
import { getLastTransactions } from "../utils/getLastTransactions";

const router = Router();

// GET — всі продажі з пагінацією
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const sortField = req.query.sortField as string;
    const sortOrder = parseInt(req.query.sortOrder as string);
    const filtersRaw = req.query.filters as string;

    // 🔹 1. Розпарсимо фільтри
    const filters = filtersRaw ? JSON.parse(filtersRaw) : {};

    // 🔹 2. Побудуємо query-об’єкт для MongoDB
    const query: Record<string, any> = {};

    // допоміжна функція для перевірки дати
    const isValidDate = (v: any) => {
      const d = new Date(v);
      return !isNaN(d.getTime());
    };

    Object.entries(filters).forEach(([key, filter]: any) => {
      if (
        filter == null ||
        filter.value === undefined ||
        filter.value === null ||
        filter.value === ""
      )
        return;

      // Спеціальна логіка для поля invoiceDate (щоб не застосовувати $regex до Date)
      if (key === "invoiceDate") {
        const val = filter.value;

        // формат: [start, end]
        if (
          Array.isArray(val) &&
          val.length === 2 &&
          isValidDate(val[0]) &&
          isValidDate(val[1])
        ) {
          const start = new Date(val[0]);
          const end = new Date(val[1]);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          query[key] = { $gte: start, $lte: end };
        } else if (typeof val === "string" && isValidDate(val)) {
          // одиночна дата — весь день
          const d = new Date(val);
          const start = new Date(d);
          start.setHours(0, 0, 0, 0);
          const end = new Date(d);
          end.setHours(23, 59, 59, 999);
          query[key] = { $gte: start, $lte: end };
        } else if (
          typeof val === "object" &&
          isValidDate(val.start) &&
          isValidDate(val.end)
        ) {
          const start = new Date(val.start);
          const end = new Date(val.end);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          query[key] = { $gte: start, $lte: end };
        }
        return;
      }

      switch (filter.matchMode) {
        case "contains":
          query[key] = { $regex: filter.value, $options: "i" };
          break;
        case "equals":
          query[key] = filter.value;
          break;
        default:
          break;
      }
    });

    // 🔹 3. Сортування
    const sort: Record<string, 1 | -1> = {};
    if (sortField) {
      sort[sortField] = sortOrder === 1 ? 1 : -1;
    } else {
      sort["date"] = -1; // стандартне сортування, якщо не вказано
    }

    // 🔹 4. Підрахунок кількості всіх документів з урахуванням фільтрів
    const total = await Sale.countDocuments(query);

    // 🔹 5. Отримання даних з урахуванням фільтрів, сортування та пагінації
    const sales = await Sale.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ total, page, limit, sales });
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
