import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            trim: true
        }
    },
    { timestamps: true }
);

const Category = model<ICategory>("Category", categorySchema);

export default Category;
