/**
 * Parse a localized number to a float.
 * @param stringNumber - the localized number
 * @param locale - [optional] the locale that the number is represented in. Omit this parameter to use the current locale.
 */
export const parseLocaleNumber = (stringNumber: string, locale = "vi-VN") => {
  const thousandSeparator = Intl.NumberFormat(locale)
    .format(11111)
    .replace(/\p{Number}/gu, "")

  const decimalSeparator = Intl.NumberFormat(locale)
    .format(1.1)
    .replace(/\p{Number}/gu, "")

  return parseFloat(
    stringNumber
      .replace(new RegExp("\\" + thousandSeparator, "g"), "")
      .replace(new RegExp("\\" + decimalSeparator), ".")
  )
}

/**
 * Format a number variable to a localized
 * @param number - the number will be format
 * @param locale - [optional] the locale that the number is represented in. Omit this parameter to use the current locale.
 * @param currency - [optional]
 */
export const formatLocaleNumber = (
  number: number,
  style: "decimal" | "currency" | "percent" = "decimal",
  locale = "en-US",
  currency = "VND"
) =>
  new Intl.NumberFormat(locale, {
    style,
    currency,
  }).format(number)

/**
 * Removes non-numeric characters from a string and returns the resulting number string.
 *
 * @param numberString - The input string from which to extract numbers.
 * @returns The number string containing only numeric characters.
 */
export const getNumbersFromString = (numberString: string) =>
  numberString.replace(/[^0-9]/g, "")

/**
 * Generates a random integer between 0 and the specified maximum value.
 *
 * @param max - The maximum value for the random number (exclusive).
 * @returns The generated random integer.
 */
export const getRandomNumber = (max = 1000): number =>
  Math.floor(Math.random() * max)

/**
 * Parse a number string with commas into a numeric value.
 *
 * @param string - The number string with commas.
 * @returns The parsed numeric value.
 */
export const parseNumber = (string: string) => {
  return Number(string.replace(/[^\d.-]/g, ""))
}

/**
 * Format a numeric string with commas.
 *
 * @param string - The numeric string to format.
 * @returns The formatted numeric string with commas.
 */
export const formatNumber = (string: string) => {
  const formattedNumber = parseNumber(string).toLocaleString()

  if (string.includes(".") && string.indexOf(".") === string.length - 1) {
    return formattedNumber + "."
  }

  return formattedNumber
}

/**
 * Format a real number represented as a string with thousands separators and optional decimal precision.
 * @param inputNumber - The number as a string to be formatted.
 * @param decimalLim - The maximum number of decimal places to display. Default is 4.
 * @returns A formatted string with the specified decimal precision.
 */
export const realNumberDecimalFormat = (
  inputNumber: string,
  decimalLim = 4
): string => {
  // Check if the input is empty or undefined, and return an empty string.
  if (!inputNumber) {
    return ""
  }

  // Convert the input number to a string for consistency.
  const numberStr = inputNumber.toString()

  // Find the index of the decimal point in the string.
  const dotIndex = numberStr.indexOf(".")

  // Regular expression to match thousands separators.
  const commonMatch = new RegExp(/\B(?=(\d{3})+(?!\d))/g)

  // If there is no decimal point in the input number, format the integer part only.
  if (dotIndex === -1) {
    return numberStr.replace(commonMatch, ",")
  }

  // Calculate the number of decimal places in the input number.
  const numLengthAfterDecimalPoint = numberStr.length - dotIndex - 1
  let result = inputNumber

  // If the number of decimal places exceeds the specified limit, round and limit it.
  if (numLengthAfterDecimalPoint >= decimalLim) {
    result = parseFloat(inputNumber).toFixed(decimalLim)
  }

  // Split the result into the integer and decimal parts.
  const [numberPart, decimalPart] = result.toString().split(".")

  // If no decimal places are required, return the integer part with thousands separators.
  if (decimalLim === 0) {
    return numberPart.replace(commonMatch, ",")
  }

  // Return the formatted number with thousands separators and the specified decimal precision.
  return numberPart.replace(commonMatch, ",") + "." + decimalPart
}
