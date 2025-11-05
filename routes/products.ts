import { Router } from "express";
import Product from "../models/Product";
import { getTopProducts } from "../utils/getTopProducts";

const router = Router();

// GET — всі продукти
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const sortField = req.query.sortField as string;
    const sortOrder = parseInt(req.query.sortOrder as string);
    const filtersRaw = req.query.filters as string;

    // Парсимо фільтри (якщо є)
    const filters = filtersRaw ? JSON.parse(filtersRaw) : {};

    // Побудуємо query-об'єкт
    const query: Record<string, any> = {};
    const andClauses: any[] = [];

    Object.entries(filters).forEach(([key, filter]: any) => {
      if (
        filter == null ||
        filter.value === undefined ||
        filter.value === null ||
        filter.value === ""
      )
        return;

      // Спеціальна обробка для числового поля unitPrice
      if (key === "unitPrice") {
        if (filter.matchMode === "equals") {
          const n = Number(filter.value);
          query[key] = Number.isNaN(n) ? filter.value : n;
        } else if (filter.matchMode === "contains") {
          // Для contains будемо порівнювати рядкове представлення числа
          andClauses.push({
            $expr: {
              $regexMatch: {
                input: { $toString: `$${key}` },
                regex: String(filter.value),
                options: "i",
              },
            },
          });
        }
        return;
      }

      // Інші поля (stockCode, description) — рядкові
      switch (filter.matchMode) {
        case "contains":
          query[key] = { $regex: String(filter.value), $options: "i" };
          break;
        case "equals":
          query[key] = filter.value;
          break;
        default:
          break;
      }
    });

    if (andClauses.length) {
      query.$and = (query.$and || []).concat(andClauses);
    }

    // Сортування
    const sort: Record<string, 1 | -1> = {};
    if (sortField) {
      sort[sortField] = sortOrder === 1 ? 1 : -1;
    } else {
      sort["stockCode"] = 1; // стандартне сортування
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ total, page, limit, products });
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
