/**
 * Вспомогательные функции и утилиты для генератора карточек Русского Лотто
 */


/**
 * Генерирует случайное целое число в заданном диапазоне (включительно)
 * @param {number} min — минимальное значение
 * @param {number} max — максимальное значение
 * @returns {number} случайное число в диапазоне [min, max]
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Перемешивает массив по алгоритму Фишера‑Йейтса (Fisher‑Yates shuffle)
 * @param {Array} array — массив для перемешивания
 * @returns {Array} перемешанный массив
 */
function shuffleArray(array) {
  const arr = [...array]; // Создаём копию массива
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]; // Обмен элементов
  }
  return arr;
}

/**
 * Проверяет, является ли значение числом и находится ли в заданном диапазоне
 * @param {*} value — проверяемое значение
 * @param {number} min — нижняя граница диапазона
 * @param {number} max — верхняя граница диапазона
 * @returns {boolean} true, если значение — число в диапазоне
 */
function isValidNumberInRange(value, min, max) {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

/**
 * Форматирует число, дополняя его нулями слева до заданной длины
 * @param {number|string} number — число для форматирования
 * @param {number} length — требуемая длина строки
 * @returns {string} отформатированная строка
 */
function padNumber(number, length) {
  return String(number).padStart(length, '0');
}

/**
 * Конвертирует десятые доли миллиметра в пункты (pt) для PDF
 * 1 мм = 2.83464567 pt, поэтому 1/10 мм = 0.283464567 pt
 * @param {number} tenthsOfMillimeters — размер в десятых долях мм
 * @returns {number} размер в пунктах (pt), округлённый до целого
 */
function convertTenthsMmToPt(tenthsOfMillimeters) {
  const MM_TO_PT_FACTOR = 0.283464567;
  return Math.round(tenthsOfMillimeters * MM_TO_PT_FACTOR);
}

/**
 * Валидирует конфигурацию генерации PDF
 * @param {Object} config — объект конфигурации
 * @returns {{isValid: boolean, errors: string[]}} результат валидации
 */
function validateConfig(config) {
  const errors = [];

  if (!isValidNumberInRange(config.pageCount, 1, 100)) {
    errors.push('Количество страниц должно быть от 1 до 100');
  }
  if (!isValidNumberInRange(config.fontSize, 16, 36)) {
    errors.push('Размер шрифта чисел должен быть от 16 до 36 pt');
  }
  if (!isValidNumberInRange(config.outerBorder, 1, 10)) {
    errors.push('Толщина внешней рамки должна быть от 1 до 10 px');
  }
  if (!isValidNumberInRange(config.innerBorder, 1, 5)) {
    errors.push('Толщина внутренней рамки должна быть от 1 до 5 px');
  }
  if (!isValidNumberInRange(config.borderSpacing, 0, 20)) {
    errors.push('Расстояние между рамками должно быть от 0 до 20 px');
  }
  if (!isValidNumberInRange(config.cardWidthTenths, 1060, 2120)) {
    errors.push('Ширина карточки должна быть от 1060 до 2120 десятых мм');
  }
  if (!isValidNumberInRange(config.cardHeightTenths, 350, 1060)) {
    errors.push('Высота карточки должна быть от 350 до 1060 десятых мм');
  }
  if (!isValidNumberInRange(config.verticalSpacing, 7, 150)) {
    errors.push('Расстояние между карточками должно быть от 7 до 150 pt');
  }
  if (!isValidNumberInRange(config.dateTimeFontSize, 1, 20)) {
    errors.push('Размер шрифта даты‑времени должен быть от 1 до 20 pt');
  }
  if (!isValidNumberInRange(config.numberFontSize, 1, 20)) {
    errors.push('Размер шрифта номера карточки должен быть от 1 до 20 pt');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Создаёт уникальный идентификатор на основе времени и случайных чисел
 * @returns {string} уникальный ID
 */
function generateUniqueId() {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `id_${timestamp}_${randomPart}`;
}

/**
 * Безопасное преобразование значения в число
 * @param {*} value — значение для преобразования
 * @param {number} defaultValue — значение по умолчанию при ошибке
 * @returns {number} преобразованное число или значение по умолчанию
 */
function safeToNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Форматирует дату и время в строку для метки карточки
 * @param {Date} date — дата для форматирования
 * @returns {string} отформатированная строка (ГГГГММДДЧЧММССммм)
 */
function formatDateTimeForLabel(date) {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1, 2);
  const day = padNumber(date.getDate(), 2);
  const hours = padNumber(date.getHours(), 2);
  const minutes = padNumber(date.getMinutes(), 2);
  const seconds = padNumber(date.getSeconds(), 2);
  const milliseconds = padNumber(date.getMilliseconds(), 3);

  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}

/**
 * Задержка выполнения (используется в асинхронных операциях)
 * @param {number} ms — время задержки в миллисекундах
 * @returns {Promise} промис, разрешающийся через указанное время
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Экспорт всех функций для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getRandomInt,
    shuffleArray,
    isValidNumberInRange,
    padNumber,
    convertTenthsMmToPt,
    validateConfig,
    generateUniqueId,
    safeToNumber,
    formatDateTimeForLabel,
    delay
  };
} else {
  window.utils = {
    getRandomInt,
    shuffleArray,
    isValidNumberInRange,
    padNumber,
    convertTenthsMmToPt,
    validateConfig,
    generateUniqueId,
    safeToNumber,
    formatDateTimeForLabel,
    delay
  };
}

