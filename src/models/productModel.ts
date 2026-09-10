import mongoose, { Document, Model, Schema, ObjectId } from "mongoose";

// Define the Product interface
export interface ProductDocument extends Document {
    name: string;
    category: string;
    stock: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

// Define the Product schema
const productSchema = new Schema<ProductDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Product: Model<ProductDocument> = mongoose.model<ProductDocument>("Product", productSchema);

export default Product;