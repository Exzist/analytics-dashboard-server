import { Schema, model, Document } from "mongoose";

export interface IProduct extends Document {
  stockCode: string;
  description: string;
  unitPrice: number;
}

const productSchema = new Schema<IProduct>({
  stockCode: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  unitPrice: { type: Number, required: true },
});

export default model<IProduct>("Product", productSchema);
