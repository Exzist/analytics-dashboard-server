import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product";
import Customer from "./models/Customer";
import Sale from "./models/Sale";

dotenv.config();

const mongoUri = process.env.MONGO_URL;
if (!mongoUri) throw new Error("MONGO_URL не визначено у .env");

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const productsMap = new Map();
const customersMap = new Map();
const salesBatch: any[] = [];

fs.createReadStream("./data/OnlineRetail.csv")
  .pipe(csv())
  .on("data", (row) => {
    const stockCode = row.StockCode;
    const customerId = row.CustomerID;
    if (!customerId) return;

    if (!productsMap.has(stockCode)) {
      productsMap.set(stockCode, {
        stockCode,
        description: row.Description,
        unitPrice: parseFloat(row.UnitPrice),
      });
    }

    if (!customersMap.has(customerId)) {
      customersMap.set(customerId, {
        customerId,
        country: row.Country,
      });
    }

    salesBatch.push({
      invoiceNo: row.InvoiceNo,
      customerId,
      stockCode,
      quantity: parseInt(row.Quantity),
      invoiceDate: new Date(row.InvoiceDate),
      unitPrice: parseFloat(row.UnitPrice),
    });
  })
  .on("end", async () => {
    console.log("CSV parsed. Inserting data...");

    await Product.insertMany(Array.from(productsMap.values()));
    await Customer.insertMany(Array.from(customersMap.values()));

    const chunkSize = 5000;
    for (let i = 0; i < salesBatch.length; i += chunkSize) {
      const chunk = salesBatch.slice(i, i + chunkSize);
      await Sale.insertMany(chunk);
      console.log(`Inserted ${i + chunk.length} sales`);
    }

    console.log("All data inserted successfully!");
    mongoose.disconnect();
  });
