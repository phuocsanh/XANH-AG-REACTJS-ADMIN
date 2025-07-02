// export const formatDateSearch = (key1, key2, date) => {
//   return date ? { [key1]: date?.startDate, [key2]: date?.endDate } : null;
// };

/**
 * Converts a date string to a localized ISO string representation
 * adjusted for the local timezone.
 *
 * @param {string} date - The date string to convert.
 * @returns {string} The localized ISO string.
 */
export const toLocaleISOString = (date: string | number | Date | null): string | null => {
  if (!date) return null;

  const myDate = new Date(date);
  const timezoneOffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds

  return new Date(myDate.getTime() - timezoneOffset).toISOString().slice(0, -1);

  // return zonedTimeToUtc(date, 'Asia/Ho_Chi_Minh').toISOString();
  // return new Date(date).toISOString();
};

/**
 *
 * @param date
 * @returns
 */
export const toISOString = (date?: string | Date | undefined) => {
  if (!date) {
    return new Date().toISOString();
  }
  return new Date(date).toISOString();
};

export const toLocaleDate = (date: string | number | Date | null): Date | null => {
  if (!date) return null;

  // // return zonedTimeToUtc(date, 'Asia/Ho_Chi_Minh'); // In June 110am in Los Angeles is 5pm UTC

  // const ISODate = new Date(date).toISOString();
  // return parseISO(ISODate);

  // if (!date) return null;

  const myDate = new Date(date);
  const timezoneOffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds

  return new Date(myDate.getTime() - timezoneOffset);
};

export const toDateType = (date: string | Date | null): Date | null => {
  return date ? new Date(date) : null;
};

export const formatDate = (
  date: Date,
  format: string = 'dd/MM/yyyy',
  use12HourClock: boolean = false
): string => {
  if (date) {
    const year = date.getUTCFullYear().toString();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hour24 = date.getUTCHours().toString().padStart(2, '0');
    const hour12 = (parseInt(hour24) % 12).toString().padStart(2, '0');
    const minute = date.getUTCMinutes().toString().padStart(2, '0');
    const period = use12HourClock ? (date.getUTCHours() < 12 ? 'AM' : 'PM') : '';
    // console.log(year, month, day, hour24, hour12, minute, period);
    const formattedDate = format
      .replace('yyyy', year)
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hour24)
      .replace('hh', hour12)
      .replace('mm', minute)
      .replace('a', period);

    return formattedDate;
  }
  return 'Invalid date';
};
