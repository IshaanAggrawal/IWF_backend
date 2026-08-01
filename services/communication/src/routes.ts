import { Router } from "express";
import contactRoutes from "./routes/contactRoutes";

const router = Router();

router.use("/", contactRoutes);

export default router;
