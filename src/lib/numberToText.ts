/**
 * Converts a number to its Vietnamese word representation.
 * @param {number} number - The number to convert.
 * @returns {string} The Vietnamese word representation of the number.
 */

const DEFAULT_NUMBERS = ' hai ba bốn năm sáu bảy tám chín';

const DICTS = {
  UNITS: ('? một' + DEFAULT_NUMBERS).split(' '),
  TENS: ('lẻ mười' + DEFAULT_NUMBERS).split(' '),
  HUNDREDS: ('không một' + DEFAULT_NUMBERS).split(' '),
};

const HUNDRED = 'trăm';

const DIGITS = 'x nghìn triệu tỉ nghìn'.split(' ');

/**
 * additional words
 * @param  {string} block_of_2 [description]
 * @return {string}   [description]
 */
const tenth = (blockOfTwo: string) => {
  const [ten, one] = blockOfTwo;

  const numberTen = Number(ten);
  const numberUnit = Number(one);

  let unit = DICTS.UNITS[numberUnit];
  const result = [DICTS.TENS[numberTen]];

  if (numberTen > 0 && numberTen == 5) {
    unit = 'lăm';
  }

  if (numberTen > 1) {
    result.push('mươi');

    if (numberTen == 1) {
      unit = 'mốt';
    }
  }

  if (unit !== '?') {
    result.push(unit);
  }

  return result.join(' ');
};

/**
 * convert number in blocks of 3
 * @param  {string} block "block of 3 mumbers"
 * @return {string}   [description]
 */
const blockOfThree = (block: string) => {
  switch (block.length) {
    case 1:
      return DICTS.UNITS[Number(block)];
    case 2:
      return tenth(block);
    case 3: {
      const result = [DICTS.HUNDREDS[Number(block[0])], HUNDRED];
      const tens = block.slice(1, 3);

      if (tens != '00') {
        result.push(tenth(tens));
      }

      return result.join(' ');
    }
  }

  return '';
};

export const toVietnameseWords = (input: string, currency: string) => {
  const str = String(parseInt(input));
  let index = str.length;

  if (index == 0 || str == 'NaN') {
    return '';
  }

  const blocks = [];
  const result = [];

  //explode number string into blocks of 3numbers and push to queue
  while (index >= 0) {
    blocks.push(str.substring(index, Math.max(index - 3, 0)));
    index -= 3;
  }

  //loop though queue and convert each block
  let digitCounter = 0;

  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i] == '000') {
      digitCounter += 1;
      if (i == 2 && digitCounter == 2) {
        result.push(DIGITS[i + 1]);
      }
    } else if (blocks[i] !== '') {
      digitCounter = 0;
      const digit = DIGITS[i];

      result.push(blockOfThree(blocks[i]));

      if (digit && digit !== 'x') {
        result.push(digit);
      }
    }
  }

  if (currency) {
    result.push(currency);
  }

  //remove unwanted white space
  return result.join(' ');
};
