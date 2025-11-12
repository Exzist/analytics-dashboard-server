import Sale from "../models/Sale";

interface Filter {
  value?: any;
  matchMode?: string;
}

interface Filters {
  [key: string]: Filter;
}

export const getSales = async (params: {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: number;
  filtersRaw?: string;
}) => {
  const { page = 1, limit = 100, sortField, sortOrder, filtersRaw } = params;

  const filters: Filters = filtersRaw ? JSON.parse(filtersRaw) : {};
  const query: Record<string, any> = {};

  const isValidDate = (v: any) => {
    const d = new Date(v);
    return !isNaN(d.getTime());
  };

  Object.entries(filters).forEach(([key, filter]) => {
    if (
      !filter ||
      filter.value === undefined ||
      filter.value === null ||
      filter.value === ""
    )
      return;

    // 🔹 Обробка фільтра дати
    if (key === "invoiceDate") {
      const val = filter.value;
      if (
        Array.isArray(val) &&
        val.length === 2 &&
        isValidDate(val[0]) &&
        isValidDate(val[1])
      ) {
        const start = new Date(val[0]);
        const end = new Date(val[1]);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        query[key] = { $gte: start, $lte: end };
      } else if (typeof val === "string" && isValidDate(val)) {
        const d = new Date(val);
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        query[key] = { $gte: start, $lte: end };
      } else if (
        typeof val === "object" &&
        isValidDate(val.start) &&
        isValidDate(val.end)
      ) {
        const start = new Date(val.start);
        const end = new Date(val.end);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        query[key] = { $gte: start, $lte: end };
      }
      return;
    }

    // 🔹 Текстові або числові фільтри
    switch (filter.matchMode) {
      case "contains":
        query[key] = { $regex: filter.value, $options: "i" };
        break;
      case "equals":
        query[key] = filter.value;
        break;
    }
  });

  // 🔹 Сортування
  const sort: Record<string, 1 | -1> = {};
  if (sortField) {
    sort[sortField] = sortOrder === 1 ? 1 : -1;
  } else {
    sort["date"] = -1;
  }

  // 🔹 Отримуємо дані
  const total = await Sale.countDocuments(query);
  const sales = await Sale.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  return { total, page, limit, sales };
};
