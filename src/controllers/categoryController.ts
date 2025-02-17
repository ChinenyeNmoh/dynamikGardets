import { Request, Response } from "express";
import Category, { ICategory } from "../models/categoryModel.ts";

// Create category
 const createCategory = async (req: Request, res: Response) => {
    try {
        const { title } = req.body as {
            title: string;
        };

        if (!title) {
            res.status(400).json({ message: "Category title is required" });
            return;
        }

        const existingCategory = await Category.findOne({ title });
        if (existingCategory) {
            res.status(400).json({ message: `Category "${title}" already exists` });
            return;
        }

        const category: ICategory = await Category.create({ title });

        res.status(201).json({
            message: "Category created successfully",
            category
        });
        return;

    } catch (error) {
        console.log(error)
        res.status(500).json({ message:  error.message || "Internal Server Error" });
        return;
    }
};

// Update category
const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const updatedCategory = await Category.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedCategory) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.status(200).json({
            message: "Category updated successfully",
            category: updatedCategory
        });
        return;

    } catch (error) {
        console.log(error)
        res.status(500).json({ message:  error.message || "internal server error" });
        return;
    }
};

// Delete category
const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.status(200).json({ message: "Category deleted successfully" });
        return;

    } catch (error) {
        res.status(500).json({ message: error.message || "Internal Server Error" });
        return;
    }
};

// Get a single category
const getCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const category = await Category.findById(id);

        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.status(200).json({
            message: "Success",
            category
        });
        return;

    } catch (error) {
        res.status(500).json({ message:  error.message || "Internal Server Error" });
        return;
    }
};

// Get all categories
const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Category.find();
        const count = await Category.countDocuments();

        if (categories.length === 0) {
            res.status(404).json({ message: "No categories found" });
            return;
        }

         res.status(200).json({
            message: "Success",
            count,
            categories
        });
        return;

    } catch (error) {
        console.log(error)
        res.status(500).json({ message:  error.message ||  "Internal server error"});
        return
    }
};

export { createCategory, updateCategory, deleteCategory, getCategory, getAllCategories };