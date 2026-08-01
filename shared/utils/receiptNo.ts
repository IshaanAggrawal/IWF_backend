export function generateReceiptNo(prefix = "IWF"): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${y}${m}${d}-${rand}`;
}

export function generateMemberId(categoryCode: string, seq: number): string {
  const y = new Date().getFullYear();
  return `IWF-${categoryCode}-${y}-${String(seq).padStart(3, "0")}`;
}
