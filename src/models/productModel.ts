import { Schema, model, Document } from "mongoose";

interface IImage {
    url: string;
    imageId: string;
}

export interface IProduct extends Document {
    name: string;
    description?: string;
    price: number;
    discountedPrice: number;
    category: Schema.Types.ObjectId;
    quantity: number;
    inStock: boolean;
    sold: number;
    images: IImage[];
    isFeatured: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            trim: true,
            
            required: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            min: 0,
            default: 0,
            required: true

        },
        discountedPrice: {
            type: Number,
            default: 0
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,

        },
        quantity: {
            type: Number,
            min: 0,
            default: 1
        },
        inStock: {
            type: Boolean,
            default: true
        },
        sold: {
            type: Number,
            default: 0
        },
        images: [
            {
                url: { type: String, required: true },
                imageId: { type: String, required: true }
            }

        ],
        isFeatured: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Product = model<IProduct>("Product", productSchema);

export default Product;
