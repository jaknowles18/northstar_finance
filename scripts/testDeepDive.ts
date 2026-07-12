import assert from "node:assert/strict";
import { filterTransactions } from "../lib/deepDiveAnalytics";
import type { DeepDiveFilters, Transaction } from "../lib/types";

const transaction: Transaction = { id:"1", transactionDate:"2026-07-11", amount:28.59, currency:"CAD", rawMerchant:"> PIPER ARMS PUB", normalizedMerchant:"> Piper Arms Pub", categoryId:"category-1", category:"Restaurants", notes:null, transactionSource:"gmail_rbc", confidence:1, source:"rbc_email" };
const filters: DeepDiveFilters = { preset:"3months", startDate:"2026-05-01", endDate:"2026-07-12", categoryIds:[], merchantIds:[], minAmount:null, maxAmount:null, searchText:"", source:"", uncategorizedOnly:false, recurringOnly:false, weekdays:[], month:null, sortBy:"newest" };
assert.equal(filterTransactions([transaction],filters).length,1);
assert.equal(filterTransactions([transaction],{...filters,weekdays:[0,1,2,3,4,5,6]}).length,1);
console.log("Deep Dive default and all-weekday filters passed.");
