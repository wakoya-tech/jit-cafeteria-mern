import InventoryItem from '../models/InventoryItem.js';

/** Map delivery inspection category → inventory item name */
const DELIVERY_TO_INVENTORY = {
  injera: 'Injera',
  bakery: 'Bread (Buns)',
  shiro_flour: 'Shiro Flour',
  berbere: 'Berbere Spice',
  lentils: 'Lentils (Misir)',
  onion: 'Onion',
  garlic: 'Garlic',
  rice: 'Rice',
  oil: 'Cooking Oil',
};

export async function receiveDeliveryToInventory(inspection) {
  if (!inspection.passed) {
    return { received: false, message: 'Rejected delivery — stock not added.' };
  }

  const itemName =
    DELIVERY_TO_INVENTORY[inspection.item_category] ||
    (inspection.inventory_item_name || inspection.item_type);

  const qty =
    inspection.item_category === 'injera'
      ? Number(inspection.injera_count || inspection.quantity_counted || inspection.quantity)
      : Number(inspection.quantity_counted || inspection.quantity);

  let item = await InventoryItem.findOne({ item_name: itemName });
  if (!item) {
    item = await InventoryItem.create({
      item_name: itemName,
      category: 'food',
      unit: inspection.item_category === 'injera' ? 'pieces' : 'kg',
      opening_balance: 0,
      received_qty: qty,
      issued_qty: 0,
      closing_balance: qty,
      supplier: inspection.supplier_name,
      remarks: `First receipt from QA #${inspection._id}`,
    });
    return { received: true, item_name: itemName, qty, created: true };
  }

  item.received_qty += qty;
  item.closing_balance = item.opening_balance + item.received_qty - item.issued_qty;
  item.last_updated = new Date();
  item.supplier = inspection.supplier_name;
  item.remarks = `QA accepted ${new Date().toISOString().slice(0, 10)} — ${qty} ${item.unit}`;
  await item.save();

  return { received: true, item_name: itemName, qty, closing_balance: item.closing_balance };
}
