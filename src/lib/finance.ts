import type { ExpenseCategory, ExpenseEntry, ExpenseType } from "./data";

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  repair_sale: "Repair sale",
  tire_sale: "Tire sale",
  labor: "Labor income",
  parts_purchase: "Parts purchase",
  payroll: "Payroll",
  rent: "Rent",
  utilities: "Utilities",
  tools: "Tools & equipment",
  marketing: "Marketing",
  other: "Other",
};

export const EXPENSE_CATEGORY_GROUPS: { type: ExpenseType; categories: ExpenseCategory[] }[] = [
  { type: "income", categories: ["repair_sale", "tire_sale", "labor", "other"] },
  { type: "expense", categories: ["parts_purchase", "payroll", "rent", "utilities", "tools", "marketing", "other"] },
];

export function sumByType(rows: ExpenseEntry[], type: ExpenseType) {
  return rows.filter((r) => r.type === type).reduce((sum, r) => sum + r.amount, 0);
}

export function netCashflow(rows: ExpenseEntry[]) {
  return sumByType(rows, "income") - sumByType(rows, "expense");
}
