const recommendedEnv = ["MONGO_URI", "JWT_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "SMTP_HOST"];

export const validateEnvironment = () => {
  const missing = recommendedEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    console.warn(`Missing recommended environment variables: ${missing.join(", ")}`);
  }
  return { missing };
};
