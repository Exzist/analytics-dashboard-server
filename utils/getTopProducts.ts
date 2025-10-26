import Sale from "../models/Sale";

/**
 * Отримує топ-5 продуктів за кількістю продажів
 * @returns {Promise<Array<{ product: string; totalSold: number }>>}
 */
export async function getTopProducts(): Promise<
  Array<{ product: string; totalSold: number }>
> {
  const result = await Sale.aggregate([
    {
      $group: {
        _id: "$stockCode", // групуємо по коду товару
        totalSold: { $sum: "$quantity" }, // рахуємо сумарну кількість продажів
      },
    },
    {
      $sort: { totalSold: -1 }, // сортуємо за спаданням
    },
    {
      $limit: 5, // беремо тільки топ 5
    },
    {
      $lookup: {
        from: "products", // назва колекції Product (в Mongoose model)
        localField: "_id", // поле зі схеми Sale
        foreignField: "stockCode", // поле зі схеми Product
        as: "productInfo",
      },
    },
    {
      $unwind: {
        path: "$productInfo",
        preserveNullAndEmptyArrays: true, // якщо продукт не знайдено — не падати
      },
    },
    {
      $project: {
        _id: 0,
        product: {
          $ifNull: ["$productInfo.description", "$_id"], // якщо опис відсутній — показує код
        },
        totalSold: 1,
      },
    },
  ]);

  return result;
}
