// utils/shiftUtils.js

// Shift timing definitions for 3 shifts
const SHIFT_TIMINGS = {
    'Morning Shift': { start: 6, end: 12, label: 'Morning Shift (6:00 - 12:00)' },
    'Afternoon Shift': { start: 12, end: 17, label: 'Afternoon Shift (12:00 - 17:00)' },
    'Evening Shift': { start: 17, end: 22, label: 'Evening Shift (17:00 - 22:00)' }
};

// Get current shift based on time
export function getCurrentShift(date = new Date()) {
    const hour = date.getHours();

    if (hour >= SHIFT_TIMINGS['Morning Shift'].start && hour < SHIFT_TIMINGS['Morning Shift'].end) {
        return 'Morning Shift';
    } else if (hour >= SHIFT_TIMINGS['Afternoon Shift'].start && hour < SHIFT_TIMINGS['Afternoon Shift'].end) {
        return 'Afternoon Shift';
    } else if (hour >= SHIFT_TIMINGS['Evening Shift'].start && hour < SHIFT_TIMINGS['Evening Shift'].end) {
        return 'Evening Shift';
    }

    return null; // Outside operating hours (10 PM - 6 AM)
}

// Get shift timing details
export function getShiftTiming(shift) {
    return SHIFT_TIMINGS[shift] || null;
}

// Check if a shift is currently active
export function isShiftActive(shift, date = new Date()) {
    const timing = SHIFT_TIMINGS[shift];
    if (!timing) return false;

    const hour = date.getHours();
    return hour >= timing.start && hour < timing.end;
}

// Get all shifts with their timing info
export function getAllShifts() {
    return Object.keys(SHIFT_TIMINGS).map(shift => ({
        name: shift,
        ...SHIFT_TIMINGS[shift],
        timeRange: `${formatShiftTime(SHIFT_TIMINGS[shift].start)} - ${formatShiftTime(SHIFT_TIMINGS[shift].end)}`
    }));
}

// Format time for display
export function formatShiftTime(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
}

// Get shift for a specific time
export function getShiftForTime(hour) {
    if (hour >= SHIFT_TIMINGS['Morning Shift'].start && hour < SHIFT_TIMINGS['Morning Shift'].end) {
        return 'Morning Shift';
    } else if (hour >= SHIFT_TIMINGS['Afternoon Shift'].start && hour < SHIFT_TIMINGS['Afternoon Shift'].end) {
        return 'Afternoon Shift';
    } else if (hour >= SHIFT_TIMINGS['Evening Shift'].start && hour < SHIFT_TIMINGS['Evening Shift'].end) {
        return 'Evening Shift';
    }
    return null;
}