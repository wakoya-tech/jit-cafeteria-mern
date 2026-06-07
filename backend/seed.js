import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Student from './models/Student.js';
import Menu from './models/Menu.js';
import InventoryItem from './models/InventoryItem.js';
import QualityInspection from './models/QualityInspection.js';
import { buildWeeklyMenuDocs } from './data/jitWeeklyMenu.js';

dotenv.config();

const students = [
  { student_id: 'RU0830/16', name: 'Petros Bekana', department: 'Electrical Engineering', program: 'BSc', year: 4, is_intern: true, is_non_cafe: false, imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { student_id: 'RU1004/16', name: 'Tewodros Kifle', department: 'Computer Science', program: 'BSc', year: 4, is_intern: false, is_non_cafe: true, imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { student_id: 'RU1046/16', name: 'Wakoya Daba', department: 'Mechanical Engineering', program: 'BSc', year: 4, is_intern: false, is_non_cafe: false, imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { student_id: 'RR1813/15', name: 'Tariku Mato', department: 'Civil Engineering', program: 'BSc', year: 5, is_intern: false, is_non_cafe: false, imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
  { student_id: 'RU0965/16', name: 'Sudeys Mohammed', department: 'Information Technology', program: 'BSc', year: 4, is_intern: false, is_non_cafe: false, imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
  { student_id: 'RU2001/17', name: 'Abebe Kebede', department: 'Electrical Engineering', program: 'BSc', year: 3, is_intern: false, is_non_cafe: false, imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { student_id: 'RU2002/17', name: 'Hanna Tesfaye', department: 'Computer Science', program: 'BSc', year: 3, is_intern: false, is_non_cafe: false, imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
].map((s) => ({
  ...s,
  barcode: s.student_id,
}));

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Seeding Jimma University Cafeteria database...');

    await User.deleteMany({});
    await Student.deleteMany({});
    await Menu.deleteMany({});
    await InventoryItem.deleteMany({});
    await QualityInspection.deleteMany({});
    console.log('Cleared existing collections');

    // In seed.js, update the usersData array:
    const usersData = [
      { username: 'admin', password: 'admin123', role: 'administrator', fullName: 'System Administrator', assignedRole: 'Admin', assignedShift: 'None', position: 'Supervisor' },
      { username: 'manager', password: 'manager123', role: 'cafeteria_manager', fullName: 'Cafeteria Manager', assignedRole: 'Manager', assignedShift: 'None', position: 'Supervisor' },
      { username: 'cashier1', password: 'cashier123', role: 'ticker', fullName: 'Cashier One', assignedRole: 'Cashier', assignedShift: 'Morning Shift', position: 'Cashier', phoneNumber: '0912345678' },
      { username: 'cashier2', password: 'cashier123', role: 'ticker', fullName: 'Cashier Two', assignedRole: 'Cashier', assignedShift: 'Afternoon Shift', position: 'Cashier', phoneNumber: '0923456789' },
      { username: 'cashier3', password: 'cashier123', role: 'ticker', fullName: 'Cashier Three', assignedRole: 'Cashier', assignedShift: 'Morning Shift', position: 'Cashier', phoneNumber: '0934567890' },
      { username: 'registrar', password: 'registrar123', role: 'registrar', fullName: 'Academic Registrar Staff', assignedRole: 'Registrar', assignedShift: 'None', position: 'Supervisor' },
      { username: 'server1', password: 'server123', role: 'ticker', fullName: 'Solomon Bekele', assignedRole: 'Food Server', assignedShift: 'Morning Shift', position: 'Food Server', phoneNumber: '0945678901' },
      { username: 'server2', password: 'server123', role: 'ticker', fullName: 'Aster Kebede', assignedRole: 'Food Server', assignedShift: 'Afternoon Shift', position: 'Food Server', phoneNumber: '0956789012' },
      { username: 'cleaner1', password: 'cleaner123', role: 'ticker', fullName: 'Almaz Tolosa', assignedRole: 'Cleaner', assignedShift: 'Morning Shift', position: 'Cleaner', phoneNumber: '0967890123' },
      { username: 'kitchen1', password: 'kitchen123', role: 'ticker', fullName: 'Tadesse Worku', assignedRole: 'Kitchen Staff', assignedShift: 'Morning Shift', position: 'Kitchen Staff', phoneNumber: '0978901234' },
      { username: 'kitchen2', password: 'kitchen123', role: 'ticker', fullName: 'Meron Desta', assignedRole: 'Kitchen Staff', assignedShift: 'Afternoon Shift', position: 'Kitchen Staff', phoneNumber: '0989012345' },
    ];

    const users = await User.create(usersData);
    console.log(`${users.length} users created`);

    await Student.insertMany(students);
    console.log(`${students.length} students created (1D barcode = student ID)`);

    const weeklyMenus = buildWeeklyMenuDocs(users[0]._id);
    await Menu.insertMany(weeklyMenus);
    console.log(`JIT weekly meal program seeded (${weeklyMenus.length} entries, English menu)`);

    await InventoryItem.insertMany([
      { item_name: 'Injera', category: 'food', unit: 'pieces', opening_balance: 0, received_qty: 400, issued_qty: 50, closing_balance: 350, reorder_level: 100, supplier: 'Local Supplier' },
      { item_name: 'Shiro Flour', category: 'food', unit: 'kg', opening_balance: 10, received_qty: 25, issued_qty: 8, closing_balance: 27, reorder_level: 8, supplier: 'Local Supplier' },
      { item_name: 'Berbere Spice', category: 'food', unit: 'kg', opening_balance: 5, received_qty: 10, issued_qty: 3, closing_balance: 12, reorder_level: 4, supplier: 'Local Supplier' },
      { item_name: 'Lentils (Misir)', category: 'food', unit: 'kg', opening_balance: 20, received_qty: 30, issued_qty: 12, closing_balance: 38, reorder_level: 15, supplier: 'Local Supplier' },
      { item_name: 'Onion', category: 'food', unit: 'kg', opening_balance: 15, received_qty: 20, issued_qty: 10, closing_balance: 25, reorder_level: 10, supplier: 'Local Supplier' },
      { item_name: 'Garlic', category: 'food', unit: 'kg', opening_balance: 3, received_qty: 5, issued_qty: 2, closing_balance: 6, reorder_level: 2, supplier: 'Local Supplier' },
      { item_name: 'Rice', category: 'food', unit: 'kg', opening_balance: 50, received_qty: 20, issued_qty: 15, closing_balance: 55, reorder_level: 20, supplier: 'Local Supplier' },
      { item_name: 'Bread (Buns)', category: 'food', unit: 'pieces', opening_balance: 200, received_qty: 100, issued_qty: 80, closing_balance: 220, reorder_level: 50, supplier: 'Jimma Bakery' },
      { item_name: 'Cooking Oil', category: 'food', unit: 'liters', opening_balance: 30, received_qty: 10, issued_qty: 8, closing_balance: 32, reorder_level: 10 },
      { item_name: 'Cleaning Supplies', category: 'supply', unit: 'units', opening_balance: 40, received_qty: 5, issued_qty: 10, closing_balance: 35, reorder_level: 15 },
    ]);
    console.log('Inventory items created');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await QualityInspection.insertMany([
      {
        supplier_name: 'Local Supplier',
        item_type: 'Morning injera batch',
        item_category: 'injera',
        quantity: 200,
        quantity_ordered: 200,
        quantity_counted: 198,
        injera_count: 198,
        temperature_celsius: 58,
        weight_verified: true,
        delivery_date: today,
        delivery_time: '06:30',
        passed: true,
        stock_received: true,
        inspector_name: 'Cafeteria Manager',
      },
      {
        supplier_name: 'Local Supplier',
        item_type: 'Shiro flour + berbere',
        item_category: 'shiro_flour',
        quantity: 25,
        quantity_ordered: 25,
        quantity_counted: 25,
        temperature_celsius: 22,
        weight_verified: true,
        delivery_date: today,
        delivery_time: '07:00',
        passed: true,
        stock_received: true,
        inspector_name: 'Cafeteria Manager',
      },
      {
        supplier_name: 'Jimma Bakery',
        item_type: 'Bread / Buns',
        item_category: 'bakery',
        quantity: 100,
        quantity_ordered: 100,
        quantity_counted: 92,
        temperature_celsius: 6,
        mold: false,
        damage: true,
        discoloration: false,
        passed: false,
        fail_reasons: ['Short delivery: counted 92, invoice 100', 'Physical damage'],
        rejection_action: 'return_supplier',
        inspector_name: 'Cafeteria Manager',
      },
    ]);
    console.log('Sample quality inspections created (Appendix A-2)');

    console.log('\n=== Jimma University Cafeteria — Demo Accounts ===');
    console.log('Administrator : username: "admin", password: "admin123"');
    console.log('Manager       : username: "manager", password: "manager123"');
    console.log('Ticker        : username: "cashier1", password: "cashier123"');
    console.log('\nID verification:');
    console.log('  Barcode (legacy JIT ID card): scan student ID e.g. RU0830/16');
    console.log('  QR card: JU|RU0830/16');
    students.forEach((s) => console.log(`  ${s.student_id} — ${s.name}`));
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
