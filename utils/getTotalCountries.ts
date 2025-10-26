import Customer, { ICustomer } from "../models/Customer";

export async function getTotalCountries(): Promise<number> {
  const result = await Customer.aggregate([
    { $group: { _id: "$country" } }, // групуємо по країні
    { $count: "uniqueCountries" }, // рахуємо кількість груп
  ]);

  return result[0]?.uniqueCountries || 0;
}
