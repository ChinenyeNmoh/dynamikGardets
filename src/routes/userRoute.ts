import express from 'express';
import { registerUser
    , verifyToken, 
    loginUser, 
    forgotPassword, 
    resetPassword,
     updatePassword, 
     logOut
 } from '../controllers/userController.js';
import { protect,  ensureGuest, validateId } from '../middlewares/authMiddleware.js';
const router = express.Router();
// User routes
router.post('/register', ensureGuest, registerUser);
router.post('/login', ensureGuest, loginUser);
router.get('/verify/:id/:token', validateId,  verifyToken);
router.post('/forgotpassword',ensureGuest, forgotPassword);
router.get("/resetpassword/:id/:token", ensureGuest, validateId, resetPassword);
router.put("/updatepassword/:id", ensureGuest, validateId,updatePassword);
router.get('/logout', protect, logOut);

export default router;