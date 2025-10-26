import Sale from "../models/Sale";

/**
 * Повертає кількість продажів по країнах.
 * Країни з продажами < 5000 об'єднуються в категорію "Others" і завжди в кінці списку.
 */
export async function getSalesByCountry(): Promise<
  Array<{ country: string; totalSales: number }>
> {
  const result = await Sale.aggregate([
    {
      $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "customerId",
        as: "customerData",
      },
    },
    { $unwind: "$customerData" },

    {
      $group: {
        _id: "$customerData.country",
        totalSales: { $sum: "$quantity" },
      },
    },

    {
      $project: {
        _id: 0,
        country: "$_id",
        totalSales: 1,
      },
    },

    // Визначаємо категорію Others
    {
      $addFields: {
        category: {
          $cond: [{ $lt: ["$totalSales", 5000] }, "Others", "$country"],
        },
      },
    },

    // Агрегуємо Others
    {
      $group: {
        _id: "$category",
        totalSales: { $sum: "$totalSales" },
      },
    },

    // Додаємо поле для сортування (Others = 1, інші = 0)
    {
      $addFields: {
        sortOrder: { $cond: [{ $eq: ["$_id", "Others"] }, 1, 0] },
      },
    },

    {
      $project: {
        _id: 0,
        country: "$_id",
        totalSales: 1,
        sortOrder: 1,
      },
    },

    // Сортуємо: спочатку всі країни, потім Others
    { $sort: { sortOrder: 1, totalSales: -1 } },

    // Прибираємо допоміжне поле sortOrder
    { $project: { country: 1, totalSales: 1 } },
  ]);

  return result;
}
