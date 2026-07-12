import type { BillingSettings, DeepDiveFilters, Transaction } from "./types";
const date=(v:string)=>new Date(`${v}T12:00:00`); const iso=(v:Date)=>`${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;
export function getDateRangeFromPreset(preset:string,billing?:BillingSettings|null){const now=new Date();let start=new Date(now),end=new Date(now);if(preset==="last7")start.setDate(now.getDate()-6);else if(preset==="last30")start.setDate(now.getDate()-29);else if(preset==="month")start=new Date(now.getFullYear(),now.getMonth(),1);else if(preset==="lastMonth"){start=new Date(now.getFullYear(),now.getMonth()-1,1);end=new Date(now.getFullYear(),now.getMonth(),0)}else if(preset==="3months")start=new Date(now.getFullYear(),now.getMonth()-2,1);else if(preset==="6months")start=new Date(now.getFullYear(),now.getMonth()-5,1);else if(preset==="year")start=new Date(now.getFullYear(),0,1);else if(preset==="billing"&&billing)return{startDate:billing.billingPeriodStartDate,endDate:billing.billingPeriodEndDate};return{startDate:iso(start),endDate:iso(end)}}
export function getPreviousComparableRange(startDate:string,endDate:string){const start=date(startDate),end=date(endDate),days=Math.round((end.getTime()-start.getTime())/86400000)+1;const previousEnd=new Date(start);previousEnd.setDate(start.getDate()-1);const previousStart=new Date(previousEnd);previousStart.setDate(previousEnd.getDate()-days+1);return{startDate:iso(previousStart),endDate:iso(previousEnd)}}
export function filterTransactions(items: Transaction[], filters: DeepDiveFilters) {
  const merchantCounts = new Map<string, number>();
  items.forEach((transaction) => merchantCounts.set(transaction.normalizedMerchant, (merchantCounts.get(transaction.normalizedMerchant) ?? 0) + 1));
  const categoryIds = filters.categoryIds ?? [], merchantIds = filters.merchantIds ?? [], weekdays = filters.weekdays ?? [];
  const search = (filters.searchText ?? "").trim().toLowerCase();
  const filtered = items.filter((transaction) => {
    if (!transaction.transactionDate) return false;
    const transactionDate = date(transaction.transactionDate);
    if (Number.isNaN(transactionDate.getTime())) return false;
    if (filters.startDate && transaction.transactionDate < filters.startDate) return false;
    if (filters.endDate && transaction.transactionDate > filters.endDate) return false;
    if (categoryIds.length && (!transaction.categoryId || !categoryIds.includes(transaction.categoryId))) return false;
    if (merchantIds.length && !merchantIds.includes(transaction.normalizedMerchant)) return false;
    if (filters.minAmount != null && transaction.amount < filters.minAmount) return false;
    if (filters.maxAmount != null && transaction.amount > filters.maxAmount) return false;
    if (search && !`${transaction.normalizedMerchant} ${transaction.rawMerchant} ${transaction.notes ?? ""}`.toLowerCase().includes(search)) return false;
    if (filters.source && transaction.transactionSource !== filters.source) return false;
    if (filters.uncategorizedOnly && transaction.categoryId) return false;
    if (filters.recurringOnly && (merchantCounts.get(transaction.normalizedMerchant) ?? 0) < 2) return false;
    if (weekdays.length && !weekdays.includes(transactionDate.getDay())) return false;
    if (typeof filters.month === "number" && transactionDate.getMonth() !== filters.month) return false;
    return true;
  });
  return filtered.sort((a,b)=>filters.sortBy==="oldest"?(a.transactionDate??"").localeCompare(b.transactionDate??""):filters.sortBy==="amountHigh"?b.amount-a.amount:filters.sortBy==="amountLow"?a.amount-b.amount:filters.sortBy==="merchant"?a.normalizedMerchant.localeCompare(b.normalizedMerchant):filters.sortBy==="category"?(a.category??"ZZZ").localeCompare(b.category??"ZZZ"):(b.transactionDate??"").localeCompare(a.transactionDate??""));
}
export const getTotalSpend=(t:Transaction[])=>t.reduce((s,x)=>s+x.amount,0); export const getAverageTransaction=(t:Transaction[])=>t.length?getTotalSpend(t)/t.length:0;
export function getAverageDailySpend(t:Transaction[],start:string,end:string){const days=Math.floor((date(end).getTime()-date(start).getTime())/86400000)+1;return days>0?getTotalSpend(t)/days:0}
const grouped=(t:Transaction[],key:(x:Transaction)=>string)=>[...t.reduce((m,x)=>m.set(key(x),(m.get(key(x))??0)+x.amount),new Map<string,number>())].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
export const getSpendByCategory=(t:Transaction[])=>grouped(t,x=>x.category??"Uncategorized"); export const getSpendByMerchant=(t:Transaction[])=>grouped(t,x=>x.normalizedMerchant);
export const getDailySpend=(t:Transaction[])=>grouped(t,x=>x.transactionDate??"Unknown").sort((a,b)=>a.name.localeCompare(b.name)); export const getMonthlySpend=(t:Transaction[])=>grouped(t,x=>(x.transactionDate??"").slice(0,7)).sort((a,b)=>a.name.localeCompare(b.name));
export const getWeekdaySpend=(t:Transaction[])=>{const names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];return grouped(t,x=>names[date(x.transactionDate!).getDay()])}; export const getLargestTransaction=(t:Transaction[])=>[...t].sort((a,b)=>b.amount-a.amount)[0]??null; export const getUncategorizedCount=(t:Transaction[])=>t.filter(x=>!x.categoryId).length;
export function getSpendingChange(current:Transaction[],previous:Transaction[]){const prior=getTotalSpend(previous);return prior?(getTotalSpend(current)-prior)/prior*100:null}
export function generateDeepDiveInsights(current:Transaction[],previous:Transaction[],filters:DeepDiveFilters){if(!current.length)return["No transactions match the current filters."];const category=getSpendByCategory(current)[0],merchant=getSpendByMerchant(current)[0],total=getTotalSpend(current),change=getSpendingChange(current,previous),share=total>0?Math.round(category.value/total*100):0,insights=[`${category.name} made up ${share}% of spending in this period.`,`Your highest-spend merchant was ${merchant.name} at $${merchant.value.toFixed(2)}.`,`Average daily spending was $${getAverageDailySpend(current,filters.startDate!,filters.endDate!).toFixed(2)}.`];if(change!==null)insights.push(`Spending was ${Math.abs(change).toFixed(0)}% ${change>=0?"higher":"lower"} than the previous comparable period.`);const uncategorized=getUncategorizedCount(current);if(uncategorized)insights.push(`${uncategorized} uncategorized transaction${uncategorized===1?"":"s"} could improve the breakdown.`);return insights}
