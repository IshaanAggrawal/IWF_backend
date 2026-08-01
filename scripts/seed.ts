import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../shared/config/db";
import { AdminUser } from "../shared/models/AdminUser";
import { SiteSettings } from "../shared/models/SiteSettings";
import {
  ImpactStat,
  Notice,
  NewsArticle,
  GalleryItem,
  HeroSlide,
  FinancialType,
  MembershipCategory,
  Person,
  ProgramPage,
} from "../shared/models/CmsContent";
import { PatientCampaign } from "../shared/models/PatientCampaign";
import { Member } from "../shared/models/Member";
import { DonorTierConfig } from "../shared/models/DonorTierConfig";
import mongoose from "mongoose";

dotenv.config();

const FINANCIAL_TYPES = [
  "General Donation",
  "Health Care",
  "Education Support",
  "Orphan Sponsorship",
  "Course Fees & Kits",
  "Self-Employment",
  "School Project",
  "Model Village",
  "Micro Finance",
  "Community Learning Centre",
  "Skill Development",
  "Low-Cost Housing",
  "Event Fees",
  "Women's Empowerment",
  "Relief & Rehabilitation",
  "Sponsorship for Students",
];

const PATIENTS = [
  {
    legacyId: 1,
    slug: "mohammed-salim",
    name: "Mohammed Salim",
    age: 62,
    gender: "Male",
    disease: "Severe Pneumonia with Respiratory Failure",
    diagnosis:
      "A serious lung infection that has spread to both lungs, making it very difficult to breathe. The patient is currently on ventilator support in the ICU.",
    hospital: "Patna Medical College & Hospital",
    hospitalAddress: "Ashok Rajpath, Patna, Bihar - 800004",
    ward: "Medical ICU, Ward 7",
    admissionDate: "2026-06-28",
    condition: "Critical" as const,
    urgent: true,
    image: "/assets/patient-1.jpg",
    neededAmount: 85000,
    raisedAmount: 21000,
    donorsCount: 34,
    costBreakdown: [
      { label: "ICU / Ventilator Support (10 days)", amount: 40000 },
      { label: "Medicines & Antibiotics", amount: 18000 },
      { label: "Diagnostic Tests (CT Scan, Blood Work)", amount: 12000 },
      { label: "Oxygen & Emergency Procedures", amount: 10000 },
      { label: "Nurse & Attendant Support", amount: 5000 },
    ],
    verificationId: "IWF-CLS-2026-001",
    verifiedBy: "Dr. Anjum Ara, Senior Physician, PMCH",
    verificationDate: "2026-06-29",
    documents: [
      { label: "Hospital Admission Letter", type: "admission", verified: true },
      { label: "Doctor's Prescription & Report", type: "medical", verified: true },
      { label: "BPL / Income Certificate", type: "income", verified: true },
      { label: "Aadhaar Card (Patient)", type: "identity", verified: true },
      { label: "CT Scan Report", type: "prescription", verified: true },
    ],
    story: [
      "Mohammed Salim, 62, is a daily wage labourer from Darbhanga district who was brought to Patna Medical College & Hospital in a critical state after struggling to breathe for several days.",
      "Doctors diagnosed him with severe bilateral pneumonia leading to respiratory failure. He was immediately placed on ventilator support in the ICU.",
      "IWF's field team verified his case within 24 hours of admission and has been coordinating with the hospital.",
    ],
    familyBackground:
      "Wife (homemaker), one son (18, daily labourer), one daughter (16, studying in Class 10).",
    updates: [
      {
        date: "2026-06-28",
        type: "admission",
        title: "Patient Admitted to ICU",
        text: "Mohammed Salim was admitted to PMCH ICU with severe breathing difficulty.",
      },
    ],
    donationHistory: [
      { donor: "A donor from Delhi", amount: 2000, date: "2026-07-10", message: "Get well soon." },
    ],
    published: true,
  },
  {
    legacyId: 2,
    slug: "shakuntala-devi",
    name: "Shakuntala Devi",
    age: 58,
    gender: "Female",
    disease: "Acute Heart Failure",
    diagnosis: "A condition where the heart suddenly cannot pump enough blood to meet the body's needs.",
    hospital: "AIIMS Patna",
    hospitalAddress: "Phulwari Sharif, Patna, Bihar - 801505",
    ward: "Cardiology ICU",
    admissionDate: "2026-06-25",
    condition: "Serious" as const,
    urgent: true,
    image: "/assets/patient-2.jpg",
    neededAmount: 125000,
    raisedAmount: 43500,
    donorsCount: 61,
    costBreakdown: [
      { label: "Cardiac ICU & Monitoring (14 days)", amount: 55000 },
      { label: "Cardiac Medications & Injections", amount: 28000 },
      { label: "Echocardiography & Diagnostic Tests", amount: 20000 },
      { label: "Emergency Procedures", amount: 15000 },
      { label: "Nursing Care & Attendant", amount: 7000 },
    ],
    verificationId: "IWF-CLS-2026-002",
    verifiedBy: "Dr. Rakesh Sharma, Cardiologist, AIIMS Patna",
    verificationDate: "2026-06-26",
    documents: [
      { label: "Hospital Admission Letter", type: "admission", verified: true },
      { label: "Cardiologist Report & ECG", type: "medical", verified: true },
    ],
    story: ["Shakuntala Devi, 58, a homemaker from Muzaffarpur, Bihar, collapsed at home while cooking."],
    familyBackground: "Widow, two sons (both auto-rickshaw drivers).",
    updates: [],
    donationHistory: [],
    published: true,
  },
  {
    legacyId: 3,
    slug: "ramesh-kumar",
    name: "Ramesh Kumar",
    age: 47,
    gender: "Male",
    disease: "Liver Cirrhosis with GI Bleed",
    hospital: "Paras HMRI Hospital",
    hospitalAddress: "Raja Bazar, Patna, Bihar - 800014",
    ward: "Gastroenterology Unit, ICU",
    admissionDate: "2026-07-01",
    condition: "Critical" as const,
    urgent: true,
    image: "/assets/patient-3.jpg",
    neededAmount: 95000,
    raisedAmount: 30000,
    donorsCount: 42,
    costBreakdown: [
      { label: "ICU Stay & Monitoring (12 days)", amount: 36000 },
      { label: "Blood Transfusions (4 units)", amount: 20000 },
      { label: "Liver Medicines & IV Drugs", amount: 22000 },
    ],
    verificationId: "IWF-CLS-2026-003",
    verifiedBy: "Dr. Priya Mishra, Gastroenterologist, Paras HMRI",
    verificationDate: "2026-07-02",
    documents: [],
    story: ["Ramesh Kumar, 47, is a small farmer from Nalanda district."],
    updates: [],
    donationHistory: [],
    published: true,
  },
  {
    legacyId: 4,
    slug: "abdul-rahman",
    name: "Abdul Rahman",
    age: 66,
    gender: "Male",
    disease: "Kidney Failure",
    hospital: "Medanta Hospital",
    hospitalAddress: "Exhibition Road, Patna, Bihar - 800001",
    ward: "Nephrology Unit",
    admissionDate: "2026-06-20",
    condition: "Serious" as const,
    urgent: true,
    image: "/assets/patient-4.jpg",
    neededAmount: 110000,
    raisedAmount: 38000,
    donorsCount: 55,
    costBreakdown: [
      { label: "Dialysis Sessions (20 sessions)", amount: 60000 },
      { label: "Nephrology Consultation & ICU", amount: 22000 },
    ],
    verificationId: "IWF-CLS-2026-004",
    verifiedBy: "Dr. Sana Fatima, Nephrologist, Medanta Patna",
    verificationDate: "2026-06-21",
    documents: [],
    story: ["Abdul Rahman, 66, is a retired school teacher from Gaya, Bihar."],
    updates: [],
    donationHistory: [],
    published: true,
  },
];

async function seed() {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@iwf.org";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const existingAdmin = await AdminUser.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await AdminUser.create({
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "IWF Admin",
      role: "admin",
    });
    console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin already exists");
  }

  if (!(await SiteSettings.findOne())) {
    await SiteSettings.create({
      phone: "+91 99344 94248",
      email: "info@islahwelfarefoundation.org",
      address: "Bathiya, Manigachhi, Darbhanga, Bihar",
      upiId: "iwfindia@ubgb",
      membershipUpiId: "islah-foundation@upi",
      offices: [
        {
          type: "Head Office",
          badge: "HQ",
          address: "Bathiya, Manigachhi, Darbhanga, Bihar",
          phone: "+91 99344 94248",
          email: "info@islahwelfarefoundation.org",
          timing: "Mon–Sat, 10:00 AM – 5:00 PM",
        },
      ],
      bankAccounts: [
        {
          key: "indian",
          accountNo: "1004451030069725",
          accountName: "ISLAH WELFARE FOUNDATION",
          bank: "Uttar Bihar Gramin Bank",
          branch: "Baghant, Manigachhi, Darbhanga",
          ifsc: "CBIN0R10001",
          micr: "600229004",
          accountType: "Saving Account",
        },
        {
          key: "fcra",
          accountNo: "1004451030069725",
          accountName: "ISLAH WELFARE FOUNDATION",
          bank: "State Bank of India",
          branch: "FCRA Cell, 4th Floor, SBI New Delhi Main Branch, 11, Sansad Marg, New Delhi-110001",
          ifsc: "SBIN0000691",
          swift: "SBININBB104",
          accountType: "FCRA Saving Account",
        },
      ],
      legalRegistrations: [
        { label: "PAN", value: "AAATIXXXXX" },
        { label: "12A", value: "Registered" },
        { label: "80G", value: "Registered" },
        { label: "FCRA", value: "Applied / Registered" },
      ],
      presetDonationAmounts: [500, 1000, 2500, 5000, 10000],
    });
    console.log("Site settings seeded");
  }

  if ((await ImpactStat.countDocuments()) === 0) {
    await ImpactStat.insertMany([
      { key: "lives", value: 5000, suffix: "+", label: "Lives Touched", icon: "Users", color: "#15803d", sortOrder: 1 },
      { key: "camps", value: 100, suffix: "+", label: "Health Camps", icon: "HeartPulse", color: "#ea580c", sortOrder: 2 },
      { key: "students", value: 2000, suffix: "+", label: "Students Supported", icon: "BookOpen", color: "#1D4ED8", sortOrder: 3 },
      { key: "villages", value: 50, suffix: "+", label: "Villages Reached", icon: "MapPin", color: "#D97706", sortOrder: 4 },
      { key: "programs", value: 12, suffix: "", label: "Active Programs", icon: "Activity", color: "#7C3AED", sortOrder: 5 },
      { key: "years", value: 8, suffix: "", label: "Years of Service", icon: "Award", color: "#DB2777", sortOrder: 6 },
    ]);
    console.log("Impact stats seeded");
  }

  if ((await Notice.countDocuments()) === 0) {
    await Notice.insertMany([
      { text: "Urgent medical cases need your support — Donate today", href: "/donate", type: "ticker", sortOrder: 1 },
      { text: "Become an IWF Member and join the movement", href: "/membership", type: "ticker", sortOrder: 2 },
      { text: "Free health camps ongoing across Darbhanga district", href: "/news-and-events", type: "ticker", sortOrder: 3 },
      { text: "Volunteer applications open — Apply now", href: "/contact", type: "ticker", sortOrder: 4 },
      { day: "28", month: "JUN", title: "Free Medical Camp — Bathiya", type: "event", text: "Free Medical Camp — Bathiya", href: "/news-and-events", sortOrder: 1 },
      { day: "15", month: "JUN", title: "Scholarship Ceremony — Muzaffarpur", type: "event", text: "Scholarship Ceremony — Muzaffarpur", href: "/news-and-events", sortOrder: 2 },
    ]);
    console.log("Notices seeded");
  }

  if ((await NewsArticle.countDocuments()) === 0) {
    await NewsArticle.insertMany([
      {
        tag: "Health Camp",
        tagColor: "#DC2626",
        date: "June 28, 2025",
        title: "Free Medical Camp Organized at Bathiya — 200+ Patients Treated",
        excerpt:
          "IWF's Healthcare team conducted a comprehensive free medical camp at Bathiya, Darbhanga, providing consultations, medicines, and diagnostic services to over 200 patients.",
        image: "🏥",
        featured: true,
        readTime: "3 min",
        sortOrder: 1,
      },
      {
        tag: "Education",
        tagColor: "#1D4ED8",
        date: "June 15, 2025",
        title: "Annual Scholarship Distribution Ceremony Held in Muzaffarpur",
        excerpt: "100 meritorious students from underprivileged families received scholarships under the Shiksha Na Ruke campaign.",
        image: "🎓",
        featured: false,
        readTime: "2 min",
        sortOrder: 2,
      },
      {
        tag: "Women Empowerment",
        tagColor: "#DB2777",
        date: "June 05, 2025",
        title: "New Self-Help Group Launched in Sitamarhi — 30 Women Enroll",
        excerpt: "Under the She Can Fly campaign, a new SHG was formed at Sitamarhi with 30 women enrolled in vocational training.",
        image: "🤝",
        featured: false,
        readTime: "2 min",
        sortOrder: 3,
      },
      {
        tag: "Annual Report",
        tagColor: "#15803d",
        date: "May 20, 2025",
        title: "IWF Annual Report 2024–25 Published — Impact Across 50+ Villages",
        excerpt: "The Annual Report 2024–25 documents IWF's work across education, healthcare, and livelihood programmes.",
        image: "📊",
        featured: true,
        readTime: "5 min",
        sortOrder: 4,
      },
    ]);
    console.log("News seeded");
  }

  if ((await GalleryItem.countDocuments()) === 0) {
    await GalleryItem.insertMany([
      { title: "VISION ACADEMIC CITY", image: "/assets/gallery-1.jpg", type: "video", sortOrder: 1 },
      { title: "OPENING CEREMONY", image: "/assets/gallery-2.jpg", type: "video", sortOrder: 2 },
      { title: "HEALTH DIAGNOSTIC CAMP", image: "/assets/gallery-3.jpg", type: "photo", sortOrder: 3 },
      { title: "ENVIRONMENT PLANTATION", image: "/assets/gallery-4.jpg", type: "photo", sortOrder: 4 },
      { title: "SHIKSHA NA RUKE CAMPAIGN", image: "/assets/gallery-5.jpg", type: "photo", sortOrder: 5 },
      { title: "VOCATIONAL TRAINING", image: "/assets/gallery-6.jpg", type: "photo", sortOrder: 6 },
    ]);
    console.log("Gallery seeded");
  }

  if ((await HeroSlide.countDocuments()) === 0) {
    await HeroSlide.insertMany([
      { image: "/assets/hero-carousel/hero-slide-1.jpg", alt: "IWF community work", sortOrder: 1 },
      { image: "/assets/hero-carousel/hero-slide-2.jpg", alt: "Healthcare outreach", sortOrder: 2 },
      { image: "/assets/hero-carousel/hero-slide-3.jpg", alt: "Education support", sortOrder: 3 },
      { image: "/assets/hero-carousel/hero-slide-4.jpg", alt: "Rural development", sortOrder: 4 },
    ]);
    console.log("Hero slides seeded");
  }

  if ((await FinancialType.countDocuments()) === 0) {
    await FinancialType.insertMany(FINANCIAL_TYPES.map((name, i) => ({ name, sortOrder: i + 1 })));
    console.log("Financial types seeded");
  }

  if ((await MembershipCategory.countDocuments()) === 0) {
    await MembershipCategory.insertMany([
      {
        name: "Blue",
        code: "BL",
        amount: 2500,
        color: "#1D4ED8",
        features: [
          "Recognition as a Supporting Member of IWF",
          "Participation in selected programs and awareness activities",
          "Engagement in community initiatives",
        ],
        sortOrder: 1,
      },
      {
        name: "Yellow",
        code: "YL",
        amount: 4000,
        color: "#D97706",
        features: [
          "Recognition for active contribution and engagement",
          "Participation in program-level activities",
          "Opportunities to collaborate in community initiatives",
        ],
        sortOrder: 2,
      },
      {
        name: "Green",
        code: "GR",
        amount: 6000,
        color: "#15803D",
        features: [
          "Special recognition as key supporter of IWF",
          "Invitation to major programs and special events",
          "Opportunity to contribute ideas and support initiatives",
        ],
        sortOrder: 3,
      },
    ]);
    console.log("Membership categories seeded");
  }

  if ((await Person.countDocuments()) === 0) {
    await Person.insertMany([
      {
        name: "Contact Desk",
        designation: "General Enquiries",
        group: "contact",
        email: "info@islahwelfarefoundation.org",
        mobile: "+91 99344 94248",
        sortOrder: 1,
      },
    ]);
    console.log("People seeded");
  }

  if ((await ProgramPage.countDocuments()) === 0) {
    await ProgramPage.insertMany([
      {
        slug: "education",
        kind: "sector",
        eyebrow: "Programs",
        title: "Education",
        subtitle: "Quality learning and rural academic support",
        sections: [
          { key: "challenge", title: "The Challenge", body: "Rural children face barriers to quality education." },
          { key: "focus", title: "Strategic Focus", items: ["Scholarships", "Learning centres", "Mentorship"] },
        ],
      },
      {
        slug: "healthcare",
        kind: "healthcare",
        eyebrow: "Programs",
        title: "Healthcare",
        subtitle: "Preventive care, emergency support and rural wellness",
        sections: [
          { key: "challenge", title: "The Challenge", body: "Rural families lack timely access to affordable healthcare." },
        ],
      },
    ]);
    console.log("Programs seeded");
  }

  if (!(await DonorTierConfig.findOne({ key: "default" }))) {
    await DonorTierConfig.create({
      key: "default",
      tiers: [
        { name: "Silver", minAmount: 1, color: "#6B7280", label: "Silver Donor" },
        { name: "Gold", minAmount: 10000, color: "#D97706", label: "Gold Donor" },
        { name: "Platinum", minAmount: 50000, color: "#8B5CF6", label: "Platinum Donor" },
      ],
    });
    console.log("Donor tier cards seeded (Silver/Gold/Platinum)");
  }

  for (const p of PATIENTS) {
    const exists = await PatientCampaign.findOne({ slug: p.slug });
    if (!exists) {
      await PatientCampaign.create(p);
    }
  }
  console.log("Patients seeded");

  if ((await Member.countDocuments()) === 0) {
    await Member.insertMany([
      {
        memberId: "IWF-BL-2025-001",
        fullName: "Md. Aftab Alam",
        mobile: "9876543210",
        email: "aftab@example.com",
        address: "Darbhanga",
        state: "Bihar",
        district: "Darbhanga",
        pincode: "846004",
        category: "Blue",
        membershipPeriod: 1,
        consentDisplay: true,
        status: "Active",
        validTill: "2026-04-30",
        joined: "2025-04-30",
        amountPaid: 2550,
      },
      {
        memberId: "IWF-YL-2025-001",
        fullName: "Rajesh Kumar",
        mobile: "9654321098",
        email: "rajesh@example.com",
        address: "Darbhanga",
        state: "Bihar",
        district: "Darbhanga",
        pincode: "846004",
        category: "Yellow",
        membershipPeriod: 1,
        consentDisplay: true,
        status: "Active",
        validTill: "2026-05-09",
        joined: "2025-05-09",
        amountPaid: 4050,
      },
    ]);
    console.log("Demo members seeded");
  }

  console.log("Seed complete");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
