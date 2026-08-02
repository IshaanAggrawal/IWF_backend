import { Router } from "express";
import {
  createCmsResourceItem,
  deleteCmsResourceItem,
  getCmsResourceItem,
  listCmsResource,
  updateCmsResourceItem,
} from "../controllers/genericCmsController";
import { requireRole } from "@shared/middlewares/auth";

const router = Router({ mergeParams: true });

router.get("/", listCmsResource);
router.get("/:idOrSlug", getCmsResourceItem);
router.post("/", requireRole("admin", "coordinator"), createCmsResourceItem);
router.put("/:id", requireRole("admin", "coordinator"), updateCmsResourceItem);
router.delete("/:id", requireRole("admin"), deleteCmsResourceItem);

export default router;
