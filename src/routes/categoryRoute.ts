import express from 'express'
const router = express.Router()
import { createCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    getAllCategories

} from  "../controllers/categoryController.js"
import { protect,  validateId } from '../middlewares/authMiddleware.js';

router
.route("/")
.post( protect, createCategory)
.get(getAllCategories);

router
.route("/:id")
.put( validateId, protect,  updateCategory)
.delete( validateId, protect,  deleteCategory)
.get( getCategory);

export default router;