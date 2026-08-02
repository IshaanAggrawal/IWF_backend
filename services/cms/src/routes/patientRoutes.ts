import { Router } from "express";
import { getPatients, createPatient, addPatientUpdate } from "../controllers/patientController";
import { requireAdmin } from "@shared/middlewares/auth";

const router = Router();

// GET /api/cms/patients
router.get("/", getPatients);

// POST /api/cms/patients (Protected)
router.post("/", requireAdmin, createPatient);

// POST /api/cms/patients/:id/updates (Protected)
router.post("/:id/updates", requireAdmin, addPatientUpdate);

export default router;
