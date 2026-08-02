import type { Transaction } from "@/lib/types";

const formatDate = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "No date";

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="table-wrap">
      <table className="responsive-table">
        <thead><tr><th>Merchant</th><th>Category</th><th>Date</th><th className="text-right">Amount</th></tr></thead>
        <tbody>{transactions.map((transaction) => <tr key={transaction.id}>
          <td data-primary="true"><div className="font-bold">{transaction.normalizedMerchant}</div><div className="mt-1 truncate text-xs text-[#7b877f]">{transaction.rawMerchant}</div></td>
          <td data-label="Category">{transaction.category ? <span className="pill">{transaction.category}</span> : <span className="pill attention">Needs category</span>}</td>
          <td data-label="Date" className="whitespace-nowrap text-sm text-[#59675e]">{formatDate(transaction.transactionDate)}</td>
          <td data-label="Amount" className="money text-right font-bold">{new Intl.NumberFormat("en-CA", { style: "currency", currency: transaction.currency || "CAD" }).format(transaction.amount)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
