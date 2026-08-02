import { Request, Response } from "express";
import { DonationTransaction } from "@shared/models/DonationTransaction";
import { Donor } from "@shared/models/Donor";
import { Member } from "@shared/models/Member";
import { asyncHandler } from "@shared/utils/asyncHandler";

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [members, donors, donations, donationTotal] = await Promise.all([
    Member.countDocuments(),
    Donor.countDocuments(),
    DonationTransaction.countDocuments({ status: "success" }),
    DonationTransaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      members,
      donors,
      successfulDonations: donations,
      donationTotal: donationTotal[0]?.total || 0,
    },
  });
});

export const getCoordinatorDashboard = asyncHandler(async (req: Request, res: Response) => {
  const district = req.query.district ? String(req.query.district) : undefined;
  const filter = district ? { district } : {};
  const members = await Member.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: { members } });
});

export const getMemberDashboard = asyncHandler(async (req: Request, res: Response) => {
  const identifier = String(req.query.identifier || req.user?.email || "").toLowerCase();
  const member = await Member.findOne({
    $or: [{ email: identifier }, { mobile: identifier }, { memberId: identifier.toUpperCase() }],
  });
  const donations = member
    ? await DonationTransaction.find({ "formSnapshot.email": member.email, status: "success" }).sort({ createdAt: -1 })
    : [];

  res.json({ success: true, data: { member, donations } });
});
