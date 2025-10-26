import { Router } from "express";
import Customer from "../models/Customer";
import { getTotalCountries } from "../utils/getTotalCountries";

const router = Router();

// GET — всі клієнти
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
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
