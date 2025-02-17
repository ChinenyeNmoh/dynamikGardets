import Product from '../models/productModel.js';
import { Request, Response } from "express";
import { Types } from 'mongoose';
import { cloudinaryUploadImage, deleteImage } from '../utils/cloudinary.js';




// Create new product
const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, quantity, category } = req.body as {
    name: string;
    description: string;
    price: number;
    quantity: number;
    category: Types.ObjectId;
  };

  try {
    // Validate the input data
    if (!name || !description || !price || !quantity || !category || req.files.length === 0) {
      res.status(400).json({ message: "Please provide all required fields." });
      return;
    }
    // Check if a product with the same name already exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      res.status(400).json({ message: `Product with name "${name}" already exists.` });
      ;
    }

    // Prepare an array to hold image URLs
    let imageUrls: { url: string; imageId: string }[] = [];

    // Handle file uploads if files are present
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length > 0) {
      try {
        imageUrls = await cloudinaryUploadImage(files); 
      } catch (error: any) {
         res.status(500).json({ message: `Error uploading images: ${error.message}` });
        ;
      }
    }

    // Create the product
    const product = await Product.create({
      name,
      description,
      price,
      category,
      quantity,
      images: imageUrls, // Set the uploaded image URLs
    });

     res.status(201).json({
      message: "New product created successfully.",
      data: product,
    });
    return;

  } catch (error: any) {
    console.error(error);
     res.status(500).json({ message: `Server error: ${error.message}` });
     return;
  }
};

export default createProduct;


  

// Get a single product by ID
const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch product and populate the category field
    const product = await Product.findById(id).populate("category");

    if (!product) {
      res.status(404).json({ message: `Product with id ${id} not found` });
      return;
    }

     res.status(200).json({ product });
  } catch (error: any) {
    console.error(error);
     res.status(500).json({ message: `Server error: ${error.message}` });
     return;
  }
};


// Get all products with filtering, sorting, and pagination
const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  
  try {
    const { category, sort, keyword } = req.query;
    let query: Record<string, any> = {};
    let sortBy: Record<string, any> = {};
    let products:any;
    let count: number;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 8;

    // Filtering by category
    if (category) query.category = category;
   

    // Sorting
    switch (sort) {
      case "high":
        sortBy.price = -1;
        sortBy.discountedPrice = { $exists: true, $ne: null, $sort: -1 };
        break;
      case "low":
        sortBy.price = 1;
        sortBy.discountedPrice = { $exists: true, $ne: null, $sort: 1 };
        break;
      case "old":
        sortBy.createdAt = 1;
        break;
      case "alphabetical":
        sortBy.name = 1;
        break;
      default:
        sortBy.createdAt = -1; // Default: sort by newest
    }

    // Searching by keyword
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword as string, $options: "i" } },
        { description: { $regex: keyword as string, $options: "i" } },
      ];
    }

    // Fetch total count of matching products
    count = await Product.countDocuments(query);

    // Fetch paginated products with sorting and filtering
    products = await Product.find(query)
      .sort(sortBy)
      .limit(limit)
      .skip(limit * (page - 1))
      .populate("category");

    if (products.length > 0) {
       res.status(200).json({
        message: "Products retrieved successfully.",
        products,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalCount: count,
      });
    } else {
       res.status(404).json({ message: "Sorry, no product found." });
       return;
    }
  } catch (error: any) {
    console.error(error);
     res.status(500).json({ message: `Server error: ${error.message}` });
     return;
  }
};




// Update a product
const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the product exists
    const findProduct = await Product.findById(id);
    if (!findProduct) {
       res.status(404).json({ message: "Product not found" });
       return;
    }

    // Check if a product with the same name already exists
    if (req.body.name) {
      const nameExist = await Product.findOne({ name: req.body.name });
      if (nameExist && nameExist._id.toString() !== id) {
         res.status(400).json({ message: `Product with name ${req.body.name} already exists` });
         return;
      }
    }

    // Handle image upload if new images are provided
    let imageUrls = findProduct.images; // Keep existing images by default

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      try {
        // Delete old images from Cloudinary
        await Promise.all(findProduct.images.map(image => deleteImage(image.imageId)));

        // Upload new images to Cloudinary
        const uploadResults = await cloudinaryUploadImage(req.files);
        imageUrls = uploadResults;
      } catch (error: any) {
        console.error("Error handling images:", error.message);
         res.status(500).json({ message: `Error handling images: ${error.message}` });
         return;
      }
    }

    // Update only the fields provided in the request
    const updatedFields = {
      category: req.body.category || findProduct.category,
      name: req.body.name || findProduct.name,
      price: req.body.price || findProduct.price,
      description: req.body.description || findProduct.description,
      quantity: req.body.quantity || findProduct.quantity,
      images: imageUrls,
      discountedPrice: req.body.discountedPrice || findProduct.discountedPrice,
    };

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(id, updatedFields, {
      new: true,
      runValidators: true,
    });

     res.status(200).json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
    return;

  } catch (error: any) {
    console.error(error);
     res.status(500).json({ message: `Server error: ${error.message}` });
     return;
  }
};


// Delete a product
const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find and delete the product
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
       res.status(404).json({ message: `Product with id ${id} not found` });
       return;
    }

    // Delete images from Cloudinary if they exist
    if (product.images && product.images.length > 0) {
      try {
        await Promise.all(product.images.map(image => deleteImage(image.imageId)));
      } catch (error: any) {
        console.error("Error deleting images:", error.message);
         res.status(500).json({ message: `Error deleting images: ${error.message}` });
         return;
      }
    }

     res.status(200).json({
      message: "Product deleted successfully",
      data: product,
    });
    return;
  } catch (error: any) {
    console.error("Server error:", error.message);
     res.status(500).json({ message: `Server error: ${error.message}` });
     return;
  }
};


  
  
export { createProduct, getProduct, getAllProducts, updateProduct, deleteProduct}