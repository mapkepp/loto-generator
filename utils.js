/**
 * Вспомогательные функции и утилиты для генератора карточек Русского Лотто
 * Версия: 1.2.0 (улучшенная обработка ошибок, типизация и производительность)
 */

/**
 * Генерирует случайное целое число в заданном диапазоне (включительно)
 * @param {number} min — минимальное значение
 * @param {number} max — максимальное значение
 * @returns {number} случайное число в диапазоне [min, max]
 * @throws {Error} если min > max или аргументы не числа
 */
function getRandomInt(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new Error('getRandomInt: min и max должны быть числами');
  }
  if (!isFinite(min) || !isFinite(max)) {
    throw new Error('getRandomInt: min и max должны быть конечными числами');
  }
  if (min > max) {
    throw new Error('getRandomInt: min не может быть больше max');
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Перемешивает массив по алгоритму Фишера‑Йейтса (Fisher‑Yates shuffle)
 * @param {Array} array — массив для перемешивания
 * @returns {Array} перемешанный массив
 * @throws {Error} если аргумент не массив
 */
function shuffleArray(array) {
  if (!Array.isArray(array)) {
    throw new Error('shuffleArray: аргумент должен быть массивом');
  }

  // Возвращаем копию пустого массива сразу
  if (array.length === 0) return [];

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
 * @returns {{isValid: boolean, errorMessage: string}} результат проверки
 */
function isValidNumberInRange(value, min, max) {
  if (typeof value !== 'number') {
    return {
      isValid: false,
      errorMessage: `Значение "${value}" не является числом`
    };
  }

  if (!isFinite(value)) {
    return {
      isValid: false,
      errorMessage: `Значение ${value} не является конечным числом`
    };
  }

  if (isNaN(value)) {
    return {
      isValid: false,
      errorMessage: 'Значение является NaN'
    };
  }

  if (value < min) {
    return {
      isValid: false,
      errorMessage: `Значение ${value} меньше минимального допустимого (${min})`
    };
  }

  if (value > max) {
    return {
      isValid: false,
      errorMessage: `Значение ${value} больше максимального допустимого (${max})`
    };
  }

  return {
    isValid: true,
    errorMessage: ''
  };
}

/**
 * Форматирует число, дополняя его нулями слева до заданной длины
 * @param {number|string} number — число для форматирования
 * @param {number} length — требуемая длина строки
 * @returns {string} отформатированная строка
 * @throws {Error} при некорректных аргументах
 */
function padNumber(number, length) {
  if (typeof number !== 'number' && typeof number !== 'string') {
    throw new Error('padNumber: number должен быть числом или строкой');
  }
  if (typeof length !== 'number' || length < 0 || !Number.isInteger(length)) {
    throw new Error('padNumber: length должен быть неотрицательным целым числом');
  }

  return String(number).padStart(length, '0');
}

/**
 * Конвертирует десятые доли миллиметра в пункты (pt) для PDF
 * 1 мм = 2.83464567 pt, поэтому 1/10 мм = 0.283464567 pt
 * @param {number} tenthsOfMillimeters — размер в десятых долях мм
 * @returns {number} размер в пунктах (pt), округлённый до 2 знаков после запятой
 * @throws {Error} если входное значение не число
 */
function convertTenthsMmToPt(tenthsOfMillimeters) {
  if (typeof tenthsOfMillimeters !== 'number') {
    throw new Error('convertTenthsMmToPt: аргумент должен быть числом');
  }

  if (isNaN(tenthsOfMillimeters)) {
    throw new Error('convertTenthsMmToPt: значение является NaN');
  }

  if (!isFinite(tenthsOfMillimeters)) {
    throw new Error('convertTenthsMmToPt: значение должно быть конечным числом');
  }

  const MM_TO_PT_FACTOR = 0.283464567;
  return Number((tenthsOfMillimeters * MM_TO_PT_FACTOR).toFixed(2));
}

/**
 * Валидирует конфигурацию генерации PDF с подробными сообщениями об ошибках
 * @param {Object} config — объект конфигурации
 * @returns {{isValid: boolean, errors: string[]}} результат валидации
 */
function validateConfig(config) {
  const errors = [];

  // Проверяем существование конфигурации
  if (!config) {
    errors.push('Конфигурация не предоставлена');
    return { isValid: false, errors };
  }

  // Валидация каждого поля с подробными сообщениями
  const validations = [
    {
      field: 'pageCount',
      condition: isValidNumberInRange(config.pageCount, 1, 100),
      message: 'Количество страниц должно быть от 1 до 100'
    },
    {
      field: 'fontSize',
      condition: isValidNumberInRange(config.fontSize, 16, 36),
      message: 'Размер шрифта чисел должен быть от 16 до 36 pt'
    },
    {
      field: 'outerBorder',
      condition: isValidNumberInRange(config.outerBorder, 1, 10),
      message: 'Толщина внешней рамки должна быть от 1 до 10 px'
    },
    {
      field: 'innerBorder',
      condition: isValidNumberInRange(config.innerBorder, 1, 5),
      message: 'Толщина внутренней рамки должна быть от 1 до 5 px'
    },
    {
      field: 'borderSpacing',
      condition: isValidNumberInRange(config.borderSpacing, 0, 20),
      message: 'Расстояние между рамками должно быть от 0 до 20 px'
    },
    {
      field: 'cardWidthTenths',
      condition: isValidNumberInRange(config.cardWidthTenths, 1060, 2120),
      message: 'Ширина карточки должна быть от 1060 до 2120 десятых мм'
    },
    {
      field: 'cardHeightTenths',
      condition: isValidNumberInRange(config.cardHeightTenths, 350, 1060),
      message: 'Высота карточки должна быть от 350 до 1060 десятых мм'
    },
    {
      field: 'verticalSpacing',
      condition: isValidNumberInRange(config.verticalSpacing, 7, 150),
      message: 'Расстояние между карточками должно быть от 7 до 150 pt'
    },
    {
      field: 'dateTimeFontSize',
      condition: isValidNumberInRange(config.dateTimeFontSize, 1, 20),
      message: 'Размер шрифта даты‑времени должен быть от 1 до 20 pt'
    },
    {
      field: 'numberFontSize',
          condition: isValidNumberInRange(config.numberFontSize, 8, 36),
    message: 'Размер шрифта номера карточки должен быть от 8 до 36 pt'
  }
];

validations.forEach(validation => {
  if (!validation.condition.isValid) {
    errors.push(validation.message);
  }
});

// Проверка обязательных строковых полей
if (!config.fontFamily || typeof config.fontFamily !== 'string' || config.fontFamily.trim() === '') {
  errors.push('Шрифт для карточек обязателен');
} else {
  const supportedFonts = ['Helvetica', 'HelveticaBold', 'Helvetica-Oblique', 'Helvetica-BoldOblique'];
  if (!supportedFonts.includes(config.fontFamily)) {
    errors.push(`Поддерживаются только шрифты: ${supportedFonts.join(', ')}`);
  }
}

if (!config.cardType || typeof config.cardType !== 'string' || config.cardType.trim() === '') {
  errors.push('Тип карточки обязателен');
}

// Проверка логических полей
if (config.includeHeader !== undefined && typeof config.includeHeader !== 'boolean') {
  errors.push('Параметр includeHeader должен быть булевым значением');
}
if (config.includeFooter !== undefined && typeof config.includeFooter !== 'boolean') {
  errors.push('Параметр includeFooter должен быть булевым значением');
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
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // Обрабатываем строки с пробелами
  const trimmedValue = typeof value === 'string' ? value.trim() : value;

  // Если после обрезки строка пустая — возвращаем дефолт
  if (typeof trimmedValue === 'string' && trimmedValue === '') {
    return defaultValue;
  }

  const num = Number(trimmedValue);

  // Проверяем на NaN и Infinity
  if (isNaN(num) || !isFinite(num)) {
    console.warn('safeToNumber: не удалось преобразовать значение в число:', value, '→ используется значение по умолчанию:', defaultValue);
    return defaultValue;
  }

  return num;
}

/**
 * Форматирует дату и время в строку для метки карточки
 * @param {Date|string|number} date — дата для форматирования (может быть Date, строкой или timestamp)
 * @returns {string} отформатированная строка (ГГГГММДДЧЧММССммм)
 * @throws {Error} при некорректном формате даты
 */
function formatDateTimeForLabel(date) {
  let dateObj;

  // Обработка различных форматов входных данных
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    throw new Error('formatDateTimeForLabel: неверный формат даты. Ожидаются Date, строка или число');
  }

  // Проверяем валидность даты
  if (isNaN(dateObj.getTime())) {
    throw new Error('formatDateTimeForLabel: не удалось создать валидную дату из входных данных');
  }

  const year = dateObj.getFullYear();
  const month = padNumber(dateObj.getMonth() + 1, 2);
  const day = padNumber(dateObj.getDate(), 2);
  const hours = padNumber(dateObj.getHours(), 2);
  const minutes = padNumber(dateObj.getMinutes(), 2);
  const seconds = padNumber(dateObj.getSeconds(), 2);
  const milliseconds = padNumber(dateObj.getMilliseconds(), 3);

  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}

/**
 * Задержка выполнения (используется в асинхронных операциях)
 * @param {number} ms — время задержки в миллисекундах
 * @returns {Promise} промис, разрешающийся через указанное время
 * @throws {Error} если ms не является числом или отрицательным
 */
function delay(ms) {
  if (typeof ms !== 'number') {
    throw new Error('delay: аргумент ms должен быть числом');
  }
  if (ms < 0) {
    throw new Error('delay: время задержки не может быть отрицательным');
  }
  if (!Number.isFinite(ms)) {
    throw new Error('delay: время задержки должно быть конечным числом');
  }

  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Создаёт массив чисел в заданном диапазоне
 * @param {number} start — начальное число
 * @param {number} end — конечное число (включительно)
 * @param {number} step — шаг между числами (по умолчанию 1)
 * @returns {number[]} массив чисел в диапазоне [start, end] с шагом step
 */
function createRange(start, end, step = 1) {
  if (typeof start !== 'number' || typeof end !== 'number') {
    throw new Error('createRange: start и end должны быть числами');
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new Error('createRange: start и end должны быть конечными числами');
  }
  if (step <= 0) {
    throw new Error('createRange: шаг должен быть положительным числом');
  }
  if (!Number.isFinite(step)) {
    throw new Error('createRange: шаг должен быть конечным числом');
  }

  const range = [];
  for (let i = start; i <= end; i += step) {
    range.push(i);
  }
  return range;
}

/**
 * Проверяет, является ли значение пустым (null, undefined, пустая строка, пустой массив, пустой объект)
 * @param {*} value — проверяемое значение
 * @returns {boolean} true, если значение пустое
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object' && value !== null) {
    if (value instanceof Date) return false; // Даты не считаем пустыми
    return Object.keys(value).length === 0;
  }
  return false;
}

/**
 * Глубокое копирование объекта (простая реализация без циклических ссылок)
 * @param {*} obj — объект для копирования
 * @returns {*} копия объекта
 */
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCopy(item));
  }

  const copy = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy(obj[key]);
    }
  }
  return copy;
}

/**
 * Форматирует размер в удобочитаемый вид (например, 1500 десятых мм → «150 мм»)
 * @param {number} tenthsOfMillimeters — размер в десятых долях мм
 * @returns {string} отформатированная строка с единицами измерения
 * @throws {Error} если входное значение не число
 */
function formatSize(tenthsOfMillimeters) {
  if (typeof tenthsOfMillimeters !== 'number') {
    throw new Error('formatSize: аргумент должен быть числом');
  }
  if (isNaN(tenthsOfMillimeters)) {
    throw new Error('formatSize: значение является NaN');
  }
  if (!isFinite(tenthsOfMillimeters)) {
    throw new Error('formatSize: значение должно быть конечным числом');
  }

  const mm = tenthsOfMillimeters / 10;
  return `${mm}\u202Fмм`; // \u202F — узкий неразрывный пробел
}

/**
 * Нормализует конфигурацию, приводя все значения к корректным типам и заполняя значения по умолчанию
 * @param {Object} config — исходная конфигурация
 * @returns {Object} нормализованная конфигурация
 */
function normalizeConfig(config = {}) {
  const defaults = {
    pageCount: 1,
    fontSize: 24,
    outerBorder: 2,
    innerBorder: 1,
    borderSpacing: 5,
    cardWidthTenths: 1580,
    cardHeightTenths: 740,
    verticalSpacing: 20,
    dateTimeFontSize: 10,
    numberFontSize: 20,
    fontFamily: 'Helvetica',
    cardType: 'standard',
    includeHeader: true,
    includeFooter: true,
    footerMargin: 0
  };

  const normalized = { ...defaults };

  // Безопасное копирование и преобразование значений
  Object.keys(defaults).forEach(key => {
    if (config[key] !== undefined) {
      switch (key) {
        case 'pageCount':
        case 'fontSize':
        case 'outerBorder':
        case 'innerBorder':
        case 'borderSpacing':
        case 'cardWidthTenths':
        case 'cardHeightTenths':
        case 'verticalSpacing':
        case 'dateTimeFontSize':
        case 'numberFontSize':
        case 'footerMargin':
          normalized[key] = safeToNumber(config[key], defaults[key]);
          break;
        case 'fontFamily':
        case 'cardType':
          normalized[key] = typeof config[key] === 'string' ? config[key].trim() : defaults[key];
          break;
        case 'includeHeader':
        case 'includeFooter':
          normalized[key] = Boolean(config[key]);
          break;
        default:
          normalized[key] = config[key];
      }
    }
  });

  return normalized;
}

/**
 * Проверяет, является ли объект валидной конфигурацией (после нормализации)
 * @param {Object} config — конфигурация для проверки
 * @returns {{isValid: boolean, errors: string[], normalizedConfig: Object}} результат проверки и нормализованная конфигурация
 */
function validateAndNormalizeConfig(config) {
  // Сначала нормализуем
  const normalizedConfig = normalizeConfig(config);

  // Затем валидируем
  const validationResult = validateConfig(normalizedConfig);

  return {
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    normalizedConfig: normalizedConfig
  };
}

/**
 * Создаёт объект с информацией о текущей сессии генерации
 * @param {Object} config — конфигурация генерации
 * @returns {Object} объект сессии
 */
function createGenerationSession(config) {
  return {
    sessionId: generateUniqueId(),
    timestamp: Date.now(),
    config: deepCopy(config),
    status: 'pending',
    progress: 0,
    generatedPages: 0,
    totalPages: config.pageCount || 1
  };
}

/**
 * Обновляет прогресс сессии генерации
 * @param {Object} session — объект сессии
 * @param {number} progress — прогресс в процентах (0–100)
 * @param {number} generatedPages — количество сгенерированных страниц
 */
function updateGenerationProgress(session, progress, generatedPages) {
  session.progress = Math.min(100, Math.max(0, progress));
  session.generatedPages = generatedPages;
  session.lastUpdate = Date.now();
}

/**
 * Завершает сессию генерации
 * @param {Object} session — объект сессии
 * @param {'success'|'error'} status — статус завершения
 * @param {string} [message] — дополнительное сообщение
 */
function completeGenerationSession(session, status, message) {
  session.status = status;
  session.completionTime = Date.now();
  session.duration = session.completionTime - session.timestamp;
  if (message) {
    session.message = message;
  }
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
    delay,
    createRange,
    isEmpty,
    deepCopy,
    formatSize,
    normalizeConfig,
    validateAndNormalizeConfig,
    createGenerationSession,
    updateGenerationProgress,
    completeGenerationSession
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
    delay,
    createRange,
    isEmpty,
    deepCopy,
    formatSize,
    normalizeConfig,
    validateAndNormalizeConfig,
    createGenerationSession,
    updateGenerationProgress,
    completeGenerationSession
  };
}
