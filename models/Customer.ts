import { Schema, model, Document } from "mongoose";

export interface ICustomer extends Document {
  customerId: string;
  country: string;
}

const customerSchema = new Schema<ICustomer>({
  customerId: { type: String, required: true, unique: true },
  country: { type: String, required: true },
});

export default model<ICustomer>("Customer", customerSchema);
