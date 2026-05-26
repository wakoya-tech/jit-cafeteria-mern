import InventoryItem from '../models/InventoryItem.js';
import Transaction from '../models/Transaction.js';

/** Stock used per meal (injera + sauce raw materials for lunch/dinner) */
export const MEAL_STOCK_PLAN = {
  breakfast: [
    { item_name: 'Bread (Buns)', qty: 1 },
    { item_name: 'Cooking Oil', qty: 0.01 },
  ],
  lunch: [
    { item_name: 'Injera', qty: 2 },
    { item_name: 'Shiro Flour', qty: 0.08 },
    { item_name: 'Berbere Spice', qty: 0.01 },
    { item_name: 'Lentils (Misir)', qty: 0.05 },
    { item_name: 'Onion', qty: 0.03 },
    { item_name: 'Cooking Oil', qty: 0.02 },
  ],
  dinner: [
    { item_name: 'Injera', qty: 2 },
    { item_name: 'Shiro Flour', qty: 0.06 },
    { item_name: 'Rice', qty: 0.1 },
    { item_name: 'Cooking Oil', qty: 0.015 },
  ],
};

export async function deductStockForMeal(mealType) {
  const plan = MEAL_STOCK_PLAN[mealType] || [];
  const updates = [];

  for (const { item_name, qty } of plan) {
    const item = await InventoryItem.findOne({ item_name });
    if (!item) {
      updates.push({ item_name, qty, ok: false, message: 'Item not in inventory — check supplier delivery QA.' });
      continue;
    }
    if (item.closing_balance < qty) {
      updates.push({
        item_name,
        qty,
        ok: false,
        message: `Low stock: only ${item.closing_balance} ${item.unit} left.`,
      });
      continue;
    }
    item.issued_qty += qty;
    item.closing_balance = item.opening_balance + item.received_qty - item.issued_qty;
    item.last_updated = new Date();
    item.remarks = `Auto-issued for ${mealType} meal`;
    await item.save();
    updates.push({
      item_name,
      qty,
      ok: true,
      closing_balance: item.closing_balance,
      unit: item.unit,
    });
  }

  return updates;
}

export async function estimateStockUsageForRange(start, end) {
  const counts = await Transaction.aggregate([
    { $match: { transaction_date: { $gte: start, $lte: end } } },
    { $group: { _id: '$meal_type', meals: { $sum: 1 } } },
  ]);

  const usage = {};
  for (const row of counts) {
    const plan = MEAL_STOCK_PLAN[row._id] || [];
    for (const { item_name, qty } of plan) {
      usage[item_name] = (usage[item_name] || 0) + qty * row.meals;
    }
  }

  return { mealCounts: Object.fromEntries(counts.map((r) => [r._id, r.meals])), estimatedUsage: usage };
}
