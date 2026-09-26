import express from "express";
import { pingDb } from "../controllers/systemController.js";
const router = express.Router();
router.get("/refresh-db", pingDb);
export default router;
