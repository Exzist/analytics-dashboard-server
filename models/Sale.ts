import { Schema, model, Document } from "mongoose";

export interface ISale extends Document {
  invoiceNo: string;
  customerId: string; // посилання на Customers
  stockCode: string; // посилання на Products
  quantity: number;
  invoiceDate: Date;
  unitPrice: number;
}

const saleSchema = new Schema<ISale>({
  invoiceNo: { type: String, required: true },
  customerId: { type: String, required: true },
  stockCode: { type: String, required: true },
  quantity: { type: Number, required: true },
  invoiceDate: { type: Date, required: true },
  unitPrice: { type: Number, required: true },
});

export default model<ISale>("Sale", saleSchema);
