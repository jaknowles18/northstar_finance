import type { Transaction } from "./types";

export const demoTransactions: Transaction[] = [
  { id: "1", transactionDate: "2026-07-09", amount: 84.26, currency: "CAD", rawMerchant: "LOBLAWS #1024", normalizedMerchant: "Loblaws", category: "Groceries", confidence: 1, source: "rbc_email" },
  { id: "2", transactionDate: "2026-07-08", amount: 6.72, currency: "CAD", rawMerchant: "TIM HORTONS 1234", normalizedMerchant: "Tim Hortons", category: "Coffee", confidence: 1, source: "rbc_email" },
  { id: "3", transactionDate: "2026-07-07", amount: 24.18, currency: "CAD", rawMerchant: "UBER *TRIP", normalizedMerchant: "Uber", category: "Travel", confidence: .95, source: "rbc_email" },
  { id: "4", transactionDate: "2026-07-05", amount: 48.92, currency: "CAD", rawMerchant: "MCDONALDS #1234 RICHMOND HILL", normalizedMerchant: "McDonald’s", category: "Restaurants", confidence: 1, source: "rbc_email" },
  { id: "5", transactionDate: "2026-07-03", amount: 119.99, currency: "CAD", rawMerchant: "AMZN Mktp CA", normalizedMerchant: "Amazon", category: null, confidence: .9, source: "rbc_email" },
];

