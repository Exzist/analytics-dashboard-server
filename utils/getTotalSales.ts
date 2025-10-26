import Sale, { ISale } from "../models/Sale"; // твоя модель Mongoose

/**
 * Обчислює загальну суму продажів (Total Sales)
 * @returns {Promise<number>}
 */
export async function getTotalSales(): Promise<number> {
  const result = await Sale.aggregate([
    {
      // Для кожного документу обчислюємо продаж: quantity * unitPrice
      $project: {
        sales: { $multiply: ["$quantity", "$unitPrice"] },
      },
    },
    {
      // Підсумовуємо всі sales
      $group: {
        _id: null,
        totalSales: { $sum: "$sales" },
      },
    },
  ]);

  // Повертаємо totalSales або 0, якщо колекція порожня
  return result[0]?.totalSales || 0;
}
