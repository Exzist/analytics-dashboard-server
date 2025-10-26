import Sale, { ISale } from "../models/Sale";

/**
 * Повертає 10 останніх транзакцій
 * @returns {Promise<Array<ISale>>}
 */
export async function getLastTransactions(): Promise<ISale[]> {
  const result = await Sale.find()
    .sort({ invoiceDate: -1 }) // сортуємо за датою від нових до старих
    .limit(10) // беремо тільки 10 останніх
    .lean(); // повертаємо plain JS об'єкти, без Mongoose document

  return result;
}
