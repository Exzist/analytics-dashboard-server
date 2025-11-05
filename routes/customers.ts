import { Router } from "express";
import Customer from "../models/Customer";
import { getTotalCountries } from "../utils/getTotalCountries";

const router = Router();

// GET — всі клієнти
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

    Object.entries(filters).forEach(([key, filter]: any) => {
      if (
        filter == null ||
        filter.value === undefined ||
        filter.value === null ||
        filter.value === ""
      )
        return;

      // customerId зберігається як string — обробляємо як рядок
      if (key === "customerId") {
        if (filter.matchMode === "equals") {
          query[key] = String(filter.value);
        } else if (filter.matchMode === "contains") {
          query[key] = { $regex: String(filter.value), $options: "i" };
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

    // Сортування
    const sort: Record<string, 1 | -1> = {};
    if (sortField) {
      sort[sortField] = sortOrder === 1 ? 1 : -1;
    } else {
      sort["customerId"] = -1; // стандартне сортування
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ total, page, limit, customers });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET - кількість клієнтів
router.get("/customersCount", async (req, res) => {
  try {
    const customersCount = await Customer.countDocuments();
    res.json(customersCount);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET - кількість країн
router.get("/countriesCount", async (req, res) => {
  try {
    const countriesCount = await getTotalCountries();
    res.json(countriesCount);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST — додати нового клієнта
router.post("/", async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
