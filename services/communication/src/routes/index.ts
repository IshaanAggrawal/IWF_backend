import { Router } from "express";
import contactRoutes from "./contactRoutes";

const router = Router();

router.use("/", contactRoutes);

export default router;
