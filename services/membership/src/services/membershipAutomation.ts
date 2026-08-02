import { Member } from "@shared/models/Member";
import { sendMembershipReminderEmail } from "@services/communication/src/services/emailService";

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const runMembershipLifecycleAutomation = async () => {
  const today = new Date().toISOString().slice(0, 10);
  await Member.updateMany({ status: "Active", validTill: { $lt: today } }, { $set: { status: "Expired" } });

  for (const days of [30, 7]) {
    const validTill = daysFromNow(days);
    const members = await Member.find({ status: "Active", validTill });
    await Promise.all(
      members.map((member) => sendMembershipReminderEmail(member.email, member.fullName, member.validTill))
    );
  }
};

export const startMembershipLifecycleAutomation = () => {
  runMembershipLifecycleAutomation().catch(console.error);
  const dayMs = 24 * 60 * 60 * 1000;
  setInterval(() => runMembershipLifecycleAutomation().catch(console.error), dayMs);
};
