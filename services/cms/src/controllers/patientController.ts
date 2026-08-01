import { Request, Response } from "express";
import { PatientCampaign } from "../../../../shared/models/PatientCampaign";

export const getPatients = async (req: Request, res: Response) => {
  try {
    const patients = await PatientCampaign.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching patients" });
  }
};

export const createPatient = async (req: Request, res: Response) => {
  try {
    const { name, disease, hospital, neededAmount, raisedAmount, isUrgent, verificationId, image, costBreakdown } = req.body;
    
    // Auto-generate slug from name
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `patient-${Date.now()}`;
    
    const newPatient = await PatientCampaign.create({
      name,
      slug,
      disease,
      hospital,
      neededAmount,
      raisedAmount: raisedAmount || 0,
      urgent: isUrgent || false,
      verificationId,
      image,
      costBreakdown: costBreakdown || []
    });

    res.status(201).json({ success: true, data: newPatient });
  } catch (error) {
    console.error("Error creating patient:", error);
    res.status(500).json({ error: "Server error creating patient" });
  }
};

export const addPatientUpdate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, title, text, type } = req.body;

    const patient = await PatientCampaign.findById(id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    patient.updates.push({ date, title, text, type: type || "update" });
    await patient.save();

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ error: "Server error adding patient update" });
  }
};
