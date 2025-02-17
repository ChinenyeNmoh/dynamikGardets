import express from 'express'
import multer from 'multer';
const router = express.Router()
import {createProduct,
    getProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
} from  "../controllers/productController.js"
import { protect,  validateId } from '../middlewares/authMiddleware.js';


// Configure Multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// product routes
router
.route("/")
.post( protect, upload.array('images', 4), createProduct)
router.get('/getall', getAllProducts)

router
.route('/:id')
.get( validateId, getProduct)
.put(protect, upload.array('images', 4), validateId, updateProduct)
.delete( protect,  validateId, deleteProduct)

export default router