import Sale, { ISale } from "../models/Sale"; // твоя модель Mongoose

/**
 * Обчислює загальну кількість продажів по місячно
 * @returns {Promise<Array<{ month: number; totalSales: number }>>}
 */
export async function getMonthlySales(): Promise<
  Array<{ month: number; totalSales: number }>
> {
  const result = await Sale.aggregate([
    {
      $group: {
        _id: { $month: "$invoiceDate" }, // групуємо по місяцях
        totalSales: { $sum: "$quantity" }, // сума кількості продажів
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        totalSales: 1,
      },
    },
    { $sort: { month: 1 } }, // сортуємо від січня до грудня
  ]);

  // Повертаємо totalSales або 0, якщо колекція порожня
  return result;
}
