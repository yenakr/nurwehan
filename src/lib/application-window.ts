import { addDays, subDays, isMonday, isWeekend, setHours, setMinutes, isBefore, isAfter, startOfDay } from 'date-fns';

/**
 * Checks if the current time is within the application window for a target date.
 * 
 * Rules:
 * - Start: 7 days before targetDate (00:00)
 * - End: 2 business days before targetDate (17:30)
 * - Exception: Monday sessions must be applied for by previous Friday morning (11:30)
 */
export function getApplicationWindow(targetDate: Date) {
  const target = startOfDay(targetDate);
  
  // Start is 7 days before
  const start = startOfDay(addDays(target, -7));
  
  let end: Date;
  
  if (isMonday(target)) {
    // Monday exception: previous Friday morning (11:30)
    end = setMinutes(setHours(addDays(target, -3), 11), 30);
  } else {
    // Normal: 2 days before 17:30
    // We should ideally skip weekends/holidays for "2 days before"
    // For now, let's implement simple business day logic (skipping weekends)
    let daysToSubtract = 0;
    let businessDaysFound = 0;
    
    while (businessDaysFound < 2) {
      daysToSubtract++;
      const currentCheck = addDays(target, -daysToSubtract);
      if (!isWeekend(currentCheck)) {
        businessDaysFound++;
      }
    }
    
    end = setMinutes(setHours(addDays(target, -daysToSubtract), 17), 30);
  }
  
  return { start, end };
}

export function isWithinApplicationWindow(targetDate: Date, now: Date = new Date()) {
  const { start, end } = getApplicationWindow(targetDate);
  return isAfter(now, start) && isBefore(now, end);
}
