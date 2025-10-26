import fs from "fs";
import csv from "fast-csv";
import Sale from "../models/Sale";

export const importSalesCSV = async (filePath: string) => {
  return new Promise<void>((resolve, reject) => {
    const sales: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        sales.push({
          date: new Date(row.Date),
          productId: row.Product_ID,
          customerId: row.Customer_ID,
          quantity: parseInt(row.Units_Sold),
          price: parseFloat(row.Price),
          discount: parseFloat(row.Discount) || 0,
          marketingSpend: parseFloat(row.Marketing_Spend) || 0,
        });
      })
      .on("end", async () => {
        try {
          await Sale.insertMany(sales);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
  });
};
