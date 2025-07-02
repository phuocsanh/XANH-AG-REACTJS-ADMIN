/**
 * Capitalizes the first letter of a string.
 *
 * @param string - The string to capitalize.
 * @returns The string with the first letter capitalized.
 */
export const capitalizeFirstLetter = (string: string) => {
  return (string && string[0].toUpperCase() + string.slice(1)) || '';
};

/**
 * Converts the first letter of a string to lowercase.
 *
 * @param string - The string to convert.
 * @returns The string with the first letter in lowercase.
 */
export const lowercaseFirstLetter = (string: string) => {
  return string[0].toLowerCase() + string.slice(1);
};

/**
 * Gets the first and last initials of a name.
 *
 * @param name - The full name.
 * @returns The initials of the first and last names.
 */
export const getFirstAndLastInitials = (name: string): string => {
  const parts: string[] = name.split(' ');
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase();
  }

  return parts[0][0]?.toUpperCase() + parts[parts.length - 1][0]?.toUpperCase();
};

/**
 * Converts a string to camelCase.
 *
 * @param str - The string to convert.
 * @returns The camelCase version of the string.
 */
export const camelize = (str: string): string => {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
};

/**
 * Converts a given string to kebab case.
 * @param str - The input string to be converted.
 * @returns The kebab-case version of the input string.
 */
export const toKebabCase = (str: string): string => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)!
    .map(x => x.toLowerCase())
    .join('-');
};

/**
 * Converts a kebab-case string to PascalCase.
 * @param text - The kebab-case string to be converted.
 * @returns The PascalCase version of the input string.
 */
export const kebabToPascalCase = (text: string) => {
  return text.replace(/(^\w|-\w)/g, t => t.replace(/-/, '').toUpperCase());
};

/**
 * Removes Vietnamese accents from a string.
 *
 * @param str - The string with accents.
 * @returns The string with accents removed.
 */
export const removeAccents = (str: string) => {
  if (typeof str !== 'string') {
    return '';
  }

  const AccentsMap = [
    'aàảãáạăằẳẵắặâầẩẫấậ',
    'AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬ',
    'dđ',
    'DĐ',
    'eèẻẽéẹêềểễếệ',
    'EÈẺẼÉẸÊỀỂỄẾỆ',
    'iìỉĩíị',
    'IÌỈĨÍỊ',
    'oòỏõóọôồổỗốộơờởỡớợ',
    'OÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢ',
    'uùủũúụưừửữứự',
    'UÙỦŨÚỤƯỪỬỮỨỰ',
    'yỳỷỹýỵ',
    'YỲỶỸÝỴ',
  ];

  for (let i = 0; i < AccentsMap.length; i++) {
    const re = new RegExp('[' + AccentsMap[i].substr(1) + ']', 'g');
    const char = AccentsMap[i][0];
    str = str.replace(re, char);
  }

  return str;
};

/**
 *
 * @param string
 * @returns
 */
export const slugify = (string: string): string => {
  const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;';
  const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');
  return (
    string
      .toString()
      .toLowerCase()
      .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
      .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
      .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
      .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
      .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
      .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
      .replace(/đ/gi, 'd')
      .replace(/\s+/g, '-')
      .replace(p, c => b.charAt(a.indexOf(c)))
      .replace(/&/g, '-and-')
      // eslint-disable-next-line no-useless-escape
      .replace(/[^\w\-]+/g, '')
      // eslint-disable-next-line no-useless-escape
      .replace(/-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  );
};

export const getCommasNumbers = (string: string) => string.split(',').length - 1;
