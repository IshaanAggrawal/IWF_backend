import { MembershipApplication } from "@shared/models/Member";

export const processMembershipApplication = async (data: any) => {
  // Validate data here if needed, Zod can be used in controller or service
  // Create a pending membership application in the DB
  const application = await MembershipApplication.create({
    ...data,
    status: "pending",
  });
  return application;
};
