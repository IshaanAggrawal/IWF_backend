import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadFile } from "../controllers/upload.controller.js";

const router = Router();

router.post("/", upload.single("file"), uploadFile);

export default router;
