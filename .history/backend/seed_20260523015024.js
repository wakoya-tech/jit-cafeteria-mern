import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Student from './models/Student.js';
import Menu from './models/Menu.js';
import InventoryItem from './models/InventoryItem.js';

dotenv.config();

const students = [
  { student_id: 'RU0830/16', name: 'Petros Bekana', department: 'Electrical Engineering', program: 'BSc', year: 4 },
  { student_id: 'RU1004/16', name: 'Tewodros Kifle', department: 'Computer Science', program: 'BSc', year: 4 },
  { student_id: 'RU1046/16', name: 'Wakoya Daba', department: 'Mechanical Engineering', program: 'BSc', year: 4 },
  { student_id: 'RR1813/15', name: 'Tariku Mato', department: 'Civil Engineering', program: 'BSc', year: 5 },
  { student_id: 'RU0965/16', name: 'Sudeys Mohammed', department: 'Information Technology', program: 'BSc', year: 4 },
  { student_id: 'RU2001/17', name: 'Abebe Kebede', department: 'Electrical Engineering', program: 'BSc', year: 3 },
  { student_id: 'RU2002/17', name: 'Hanna Tesfaye', department: 'Computer Science', program: 'BSc', year: 3 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Seeding JIT Cafeteria database...');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Menu.deleteMany({});
    await InventoryItem.deleteMany({});
    console.log('Cleared existing collections');

    // Create users with hashed passwords
    const usersData = [
      { username: 'admin', password: 'admin123', role: 'administrator', fullName: 'System Administrator' },
      { username: 'manager', password: 'manager123', role: 'cafeteria_manager', fullName: 'Cafeteria Manager' },
      { username: 'cashier1', password: 'cashier123', role: 'cashier', fullName: 'Cashier One' },
      { username: 'cashier2', password: 'cashier123', role: 'cashier', fullName: 'Cashier Two' },
    ];

    // Hash passwords before creating users
    const usersWithHashedPasswords = await Promise.all(usersData.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10)
    })));

    const users = await User.create(usersWithHashedPasswords);
    console.log(`${users.length} users created with hashed passwords`);

    // Insert students
    await Student.insertMany(students);
    console.log(`${students.length} students created`);

    // Create today's menu
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Menu.insertMany([
      { meal_type: 'breakfast', menu_date: today, items: ['Bread', 'Tea', 'Eggs'], is_active: true, created_by: users[0]._id },
      { meal_type: 'lunch', menu_date: today, items: ['Injera', 'Shiro', 'Rice', 'Vegetables'], is_active: true, created_by: users[0]._id },
      { meal_type: 'dinner', menu_date: today, items: ['Pasta', 'Salad', 'Fruit'], is_active: true, created_by: users[0]._id },
    ]);
    console.log('Today\'s menu created');

    // Insert inventory items
    await InventoryItem.insertMany([
      { item_name: 'Rice', category: 'food', unit: 'kg', opening_balance: 50, received_qty: 20, issued_qty: 15, closing_balance: 55, reorder_level: 20, supplier: 'Local Supplier' },
      { item_name: 'Bread (Buns)', category: 'food', unit: 'pieces', opening_balance: 200, received_qty: 100, issued_qty: 80, closing_balance: 220, reorder_level: 50, supplier: 'Jimma Bakery' },
      { item_name: 'Cooking Oil', category: 'food', unit: 'liters', opening_balance: 30, received_qty: 10, issued_qty: 8, closing_balance: 32, reorder_level: 10 },
      { item_name: 'Cleaning Supplies', category: 'supply', unit: 'units', opening_balance: 40, received_qty: 5, issued_qty: 10, closing_balance: 35, reorder_level: 15 },
    ]);
    console.log('Inventory items created');

    console.log('\n=== JIT Cafeteria — Demo Accounts ===');
    console.log('Administrator : username: "admin", password: "admin123"');
    console.log('Manager       : username: "manager", password: "manager123"');
    console.log('Cashier       : username: "cashier1", password: "cashier123"');
    console.log('\nSample Student IDs for meal scan:');
    students.forEach((s) => console.log(`  ${s.student_id} — ${s.name}`));
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();