/**
 * Unit verification script for date overlap algorithm and dynamic billing calculations.
 */

// Overlap logic implementation
function checkDateOverlap(existingStart, existingEnd, newStart, newEnd) {
  // Returns true if date ranges overlap:
  // existing.start_date <= new.end_date AND existing.end_date >= new.start_date
  return existingStart <= newEnd && existingEnd >= newStart;
}

function calculateRentalDays(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 0 ? 1 : diffDays;
}

function calculateTotalCost(days, dailyRate) {
  return Number((days * Number(dailyRate)).toFixed(2));
}

console.log('--- Running Car Rental API Logic Tests ---');

// Test 1: Booking 2026-05-01 to 2026-05-05 vs Overlapping 2026-05-03 to 2026-05-07
const bookedStart = '2026-05-01';
const bookedEnd = '2026-05-05';

const attempt1Start = '2026-05-03';
const attempt1End = '2026-05-07';
const overlap1 = checkDateOverlap(bookedStart, bookedEnd, attempt1Start, attempt1End);
console.log(`Test 1 [Overlap Collision 2026-05-03 to 2026-05-07]: ${overlap1 === true ? '✅ PASSED (Detected collision)' : '❌ FAILED'}`);

// Test 2: Booking outside range (2026-05-10 to 2026-05-15)
const attempt2Start = '2026-05-10';
const attempt2End = '2026-05-15';
const overlap2 = checkDateOverlap(bookedStart, bookedEnd, attempt2Start, attempt2End);
console.log(`Test 2 [No Overlap 2026-05-10 to 2026-05-15]: ${overlap2 === false ? '✅ PASSED (No collision)' : '❌ FAILED'}`);

// Test 3: Day count & billing calculation
const days = calculateRentalDays('2026-05-01', '2026-05-05');
const dailyRate = 4500.00;
const totalCost = calculateTotalCost(days, dailyRate);
console.log(`Test 3 [Rental Days]: ${days} days (Expected: 4) ${days === 4 ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Test 3 [Total Cost]: ₹${totalCost} (Expected: 18000) ${totalCost === 18000 ? '✅ PASSED' : '❌ FAILED'}`);

// Test 4: Single day rental (same day start and end)
const singleDay = calculateRentalDays('2026-06-01', '2026-06-01');
const singleDayCost = calculateTotalCost(singleDay, 3000);
console.log(`Test 4 [Single Day Rental]: ${singleDay} day, Cost: ₹${singleDayCost} ${singleDay === 1 && singleDayCost === 3000 ? '✅ PASSED' : '❌ FAILED'}`);

console.log('--- All Logic Tests Completed ---');
