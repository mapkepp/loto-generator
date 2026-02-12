/**
 * Основной скрипт управления интерфейсом генератора карточек Русского Лотто
 * Версия: 1.2.0 (улучшенная валидация, обработка ошибок и UX)
 */

document.addEventListener('DOMContentLoaded', () => {
  console.time('Инициализация приложения'); // Замер времени инициализации
  console.log('DOM полностью загружен, инициализируем приложение...');

  // Проверка наличия PDFGenerator перед созданием экземпляра
  if (typeof PDFGenerator === 'undefined') {
    console.error('Критическая ошибка: класс PDFGenerator не определён! Проверьте подключение pdf-generator.js');
    showStatus('Ошибка: не найден модуль генерации PDF. Обновите страницу.', 'error');
    return;
  }

  // Получаем экземпляр генератора PDF
  let pdfGenerator;
  try {
    pdfGenerator = new PDFGenerator();
    console.log('Экземпляр PDFGenerator создан');
  } catch (initError) {
    console.error('Ошибка при инициализации PDFGenerator:', initError);
    showStatus('Ошибка при инициализации генератора PDF. Проверьте консоль.', 'error');
    return;
  }

  // Находим кнопку генерации в DOM
  const generateBtn = document.getElementById('generateBtn');
  if (!generateBtn) {
    console.error('Кнопка генерации PDF не найдена в DOM. Проверьте HTML-разметку.');
    showStatus('Ошибка: кнопка генерации не найдена. Проверьте код страницы.', 'error');
    return;
  }
  console.log('Кнопка генерации найдена');

  // Проверяем поддержку браузера
  if (!pdfGenerator.checkBrowserSupport()) {
    handleUnsupportedBrowser(generateBtn);
    return;
  }

  // Инициализируем отображение статуса
  initStatusDisplay();
  console.log('Инициализация интерфейса завершена');

  // Назначаем обработчик клика на кнопку
  generateBtn.addEventListener('click', handleGenerateClick);
  console.log('Обработчик клика назначен на кнопку генерации');

  console.timeEnd('Инициализация приложения'); // Завершение замера времени
});

/**
 * Обработчик клика по кнопке генерации PDF
 */
async function handleGenerateClick() {
  console.log('Обработчик клика: начало выполнения');

  const generateBtn = document.getElementById('generateBtn');

  // Блокируем кнопку и меняем текст
  generateBtn.disabled = true;
  const originalText = generateBtn.textContent;
  generateBtn.textContent = 'Генерация... Подождите';
  generateBtn.style.cursor = 'not-allowed';
  console.log('Кнопка заблокирована, текст изменён');

  try {
    // Валидируем входные данные перед генерацией
    if (!validateInputs()) {
      console.warn('Валидация входных данных не пройдена, прерываем генерацию');
      return;
    }

    // Вызываем основную функцию генерации
    const success = await pdfGenerator.generatePDF();

    if (success) {
      console.log('Генерация PDF успешно завершена');
      showStatus('PDF успешно сгенерирован и скачивается...', 'success');
    } else {
      console.warn('Генерация PDF не удалась');
      showStatus('Ошибка при генерации PDF. Проверьте консоль (F12 → Console)', 'error');
    }
  } catch (err) {
    console.error('Критическая ошибка в обработчике клика:', err);
    showStatus('Критическая ошибка при генерации PDF: ' + err.message, 'error');
  } finally {
    // Разблокируем кнопку через (DOWNLOAD_TIMEOUT + CLEANUP_DELAY)
    setTimeout(() => {
      generateBtn.disabled = false;
      generateBtn.textContent = originalText;
      generateBtn.style.cursor = 'pointer';
      console.log('Кнопка разблокирована, восстановлен исходный текст');
    }, pdfGenerator.DOWNLOAD_TIMEOUT + pdfGenerator.CLEANUP_DELAY);
  }
}

/**
 * Обработка случая неподдерживаемого браузера
 * @param {HTMLElement} btn - элемент кнопки генерации
 */
function handleUnsupportedBrowser(btn) {
  console.warn('Браузер не поддерживает необходимые API для генерации PDF');

  // Блокируем кнопку генерации
  btn.disabled = true;
  btn.textContent = 'Не поддерживается в этом браузере';
  btn.style.backgroundColor = '#ccc';
  btn.style.color = '#666';
  btn.style.cursor = 'not-allowed';
  btn.title = 'Ваш браузер не поддерживает необходимые API для генерации PDF';

  // Добавляем информационное сообщение о поддержке
  const supportInfo = document.createElement('div');
  supportInfo.id = 'supportInfo';
  supportInfo.style.cssText = `
    color: red;
    margin-top: 10px;
    font-style: italic;
    padding: 8px;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  supportInfo.textContent =
    'Ошибка: не поддерживаются необходимые технологии. ' +
    'Попробуйте открыть в Chrome, Firefox или Safari (последние версии).';
  document.getElementById('controls').appendChild(supportInfo);

  console.log('Добавлено информационное сообщение о неподдерживаемом браузере');
}

/**
 * Инициализирует отображение статуса операций
 */
function initStatusDisplay() {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) {
    console.warn('Элемент статуса (#status) не найден в DOM');
    return;
  }

  statusDiv.innerHTML = '';
  statusDiv.style.cssText = `
    margin-top: 15px;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
    font-weight: bold;
    transition: background-color 0.3s, color 0.3s;
    display: none; /* Скрываем по умолчанию */
  `;
  console.log('Элемент статуса инициализирован');
}

/**
 * Показывает сообщение статуса с указанием типа
 * @param {string} message — текст сообщения
 * @param {string} type — тип сообщения ('success', 'error', 'warning', 'info')
 */
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;

  let bgColor, textColor, icon;
  switch (type) {
    case 'success':
      bgColor = '#d4edda';
      textColor = '#155724';
      icon = '✅ ';
      break;
    case 'error':
      bgColor = '#f8d7da';
      textColor = '#721c24';
      icon = '❌ ';
      break;
    case 'warning':
      bgColor = '#fff3cd';
      textColor = '#856404';
      icon = '⚠️ ';
      break;
    default:
      bgColor = '#d1ecf1';
      textColor = '#0c5460';
      icon = '🔎 ';
  }

  statusDiv.textContent = icon + message;
  statusDiv.style.backgroundColor = bgColor;
  statusDiv.style.color = textColor;
  statusDiv.style.display = 'block'; // Показываем элемент

  console.log(`Статус установлен: "${message}" (тип: ${type})`);

  // Автоматически скрываем сообщение через 5–7 секунд
  setTimeout(() => {
    if (statusDiv.textContent.startsWith(icon)) {
      statusDiv.textContent = '';
      statusDiv.style.backgroundColor = '';
      statusDiv.style.color = '';
      statusDiv.style.display = 'none'; // Скрываем элемент
      console.log('Статус очищен автоматически');
    }
  }, 6000); // 6 секунд
}

/**
 * Валидирует входные данные формы
 * @returns {boolean} — true, если все данные корректны
 */
function validateInputs() {
  const inputs = {
    pageCount: parseInt(document.getElementById('pageCount').value, 10),
    fontSize: parseInt(document.getElementById('fontSize').value, 10),
    outerBorder: parseInt(document.getElementById('outerBorder').value, 10),
    innerBorder: parseInt(document.getElementById('innerBorder').value, 10),
    borderSpacing: parseInt(document.getElementById('borderSpacing').value, 10),
    cardWidthTenths: parseInt(document.getElementById('cardWidthTenths').value, 10),
    cardHeightTenths: parseInt(document.getElementById('cardHeightTenths').value, 10),
    verticalSpacing: parseInt(document.getElementById('verticalSpacing').value, 10),
    dateTimeFontSize: parseInt(document.getElementById('dateTimeFontSize').value, 10),
    numberFontSize: parseInt(document.getElementById('numberFontSize').value, 10),
    footerMargin: parseInt(document.getElementById('footerMargin').value, 10)
  };

  const errors = [];

  // Проверки диапазона значений с логированием
  if (isNaN(inputs.pageCount) || inputs.pageCount < 1 || inputs.pageCount > 100) {
    errors.push('Количество страниц должно быть числом от 1 до 100');
    console.warn('Некорректное количество страниц:', inputs.pageCount);
  }
  if (isNaN(inputs.fontSize) || inputs.fontSize < 16 || inputs.fontSize > 36) {
    errors.push('Размер шрифта чисел должен быть числом от 16 до 36 pt');
    console.warn('Некорректный размер шрифта:', inputs.fontSize);
  }
  if (isNaN(inputs.outerBorder) || inputs.outerBorder < 1 || inputs.outerBorder > 10) {
    errors.push('Толщина внешней рамки должна быть числом от 1 до 10 px');
    console.warn('Некорректная толщина внешней рамки:', inputs.outerBorder);
  }
  if (isNaN(inputs.innerBorder) || inputs.innerBorder < 1 || inputs.innerBorder > 5) {
    errors.push('Толщина внутренней рамки должна быть числом от 1 до 5 px');
    console.warn('Некорректная толщина внутренней рамки:', inputs.innerBorder);
  }
  if (isNaN(inputs.borderSpacing) || inputs.borderSpacing < 0 || inputs.borderSpacing > 20) {
    errors.push('Расстояние между рамками должно быть числом от 0 до 20 px');
    console.warn('Некорректное расстояние между рамками:', inputs.borderSpacing);
  }
  if (isNaN(inputs.cardWidthTenths) || inputs.cardWidthTenths < 1060 || inputs.cardWidthTenths > 2120) {
    errors.push('Ширина карточки (в десятых мм) должна быть числом от 1060 до 2120');
    console.warn('Некорректная ширина карточки:', inputs.cardWidthTenths);
  }
  if (isNaN(inputs.cardHeightTenths) || inputs.cardHeightTenths < 350 || inputs.cardHeightTenths > 1060) {
    errors.push('Высота карточки (в десятых мм) должна быть числом от 350 до 1060');
    console.warn('Некорректная высота карточки:', inputs.cardHeightTenths);
  }
  if (isNaN(inputs.verticalSpacing) || inputs.verticalSpacing < 7 || inputs.verticalSpacing > 150) {
    errors.push('Вертикальное расстояние должно быть числом от 7 до 150 pt');
    console.warn('Некорректное вертикальное расстояние:', inputs.verticalSpacing);
  }
  if (isNaN(inputs.dateTimeFontSize) || inputs.dateTimeFontSize < 1 || inputs.dateTimeFontSize > 20) {
    errors.push('Размер шрифта даты/времени должен быть числом от 1 до 20 pt');
    console.warn('Некорректный размер шрифта даты/времени:', inputs.dateTimeFontSize);
  }
  if (isNaN(inputs.numberFontSize) || inputs.numberFontSize < 8 || inputs.numberFontSize > 36) {
    errors.push('Размер шрифта номеров должен быть числом от 8 до 36 pt');
    console.warn('Некорректный размер шрифта номеров:', inputs.numberFontSize);
  }
  if (isNaN(inputs.footerMargin) || inputs.footerMargin < -50 || inputs.footerMargin > 50) {
    errors.push('Отступ нижнего колонтитула должен быть числом от −50 до 50 pt');
    console.warn('Некорректный отступ нижнего колонтитула:', inputs.footerMargin);
  }

  // Проверка шрифта
  const fontFamily = document.getElementById('fontFamily').value.trim();
  const supportedFonts = ['Helvetica', 'HelveticaBold', 'Helvetica-Oblique', 'Helvetica-BoldOblique'];
  if (!fontFamily) {
    errors.push('Обязательно выберите шрифт для карточек');
    console.warn('Шрифт не выбран');
  } else if (!supportedFonts.includes(fontFamily)) {
    errors.push(`Поддерживаются только шрифты: ${supportedFonts.join(', ')}`);
    console.warn('Неподдерживаемый шрифт:', fontFamily);
  }

  // Подсветка некорректных полей в интерфейсе
  if (errors.length > 0) {
    highlightInvalidFields(errors);
  }

  // Если есть ошибки — показываем их пользователю
  if (errors.length > 0) {
    console.error('Валидация не пройдена. Найдено ошибок:', errors.length);
    showStatus('Ошибки в настройках: ' + errors.join('; '), 'error');
    return false;
  }

  console.log('Все входные данные прошли валидацию');
  return true;
}

/**
 * Подсвечивает некорректные поля в интерфейсе
 * @param {string[]} errors — массив сообщений об ошибках
 */
function highlightInvalidFields(errors) {
  // Сбрасываем подсветку всех полей
  const controlGroups = document.querySelectorAll('.control-group');
  controlGroups.forEach(group => {
    group.style.border = '';
    group.style.boxShadow = '';
  });

  // Определяем, какие поля вызвали ошибки
  const errorFields = [];
  if (errors.some(err => err.includes('Количество страниц'))) {
    errorFields.push('pageCount');
  }
  if (errors.some(err => err.includes('Размер шрифта чисел'))) {
    errorFields.push('fontSize');
  }
  if (errors.some(err => err.includes('Толщина внешней рамки'))) {
    errorFields.push('outerBorder');
  }
  if (errors.some(err => err.includes('Толщина внутренней рамки'))) {
    errorFields.push('innerBorder');
  }
  if (errors.some(err => err.includes('Расстояние между рамками'))) {
    errorFields.push('borderSpacing');
  }
  if (errors.some(err => err.includes('Ширина карточки'))) {
    errorFields.push('cardWidthTenths');
  }
  if (errors.some(err => err.includes('Высота карточки'))) {
    errorFields.push('cardHeightTenths');
  }
  if (errors.some(err => err.includes('Вертикальное расстояние'))) {
    errorFields.push('verticalSpacing');
  }
  if (errors.some(err => err.includes('Размер шрифта даты/времени'))) {
    errorFields.push('dateTimeFontSize');
  }
  if (errors.some(err => err.includes('Размер шрифта номеров'))) {
    errorFields.push('numberFontSize');
  }
  if (errors.some(err => err.includes('Отступ нижнего колонтитула'))) {
    errorFields.push('footerMargin');
  }
    if (errors.some(err => err.includes('Обязательно выберите шрифт'))) {
    errorFields.push('fontFamily');
  }

  // Подсвечиваем проблемные поля красной рамкой
  errorFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      const controlGroup = field.closest('.control-group');
      if (controlGroup) {
        controlGroup.style.border = '2px solid #dc3545';
        controlGroup.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
        controlGroup.style.transition = 'border 0.3s, box-shadow 0.3s';
      }
      // Дополнительно подсвечиваем сам элемент ввода
      field.style.borderColor = '#dc3545';
      field.style.backgroundColor = '#fff5f5';
    }
  });

  // Автоматически убираем подсветку через 8 секунд
  setTimeout(() => {
    errorFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        const controlGroup = field.closest('.control-group');
        if (controlGroup) {
          controlGroup.style.border = '';
          controlGroup.style.boxShadow = '';
        }
        field.style.borderColor = '';
        field.style.backgroundColor = '';
      }
    });
  }, 8000);
}

/**
 * Сбрасывает подсветку всех полей формы
 */
function resetFieldHighlights() {
  const controlGroups = document.querySelectorAll('.control-group');
  controlGroups.forEach(group => {
    group.style.border = '';
    group.style.boxShadow = '';
  });

  const inputFields = document.querySelectorAll('input, select');
  inputFields.forEach(field => {
    field.style.borderColor = '';
    field.style.backgroundColor = '';
  });
}

/**
 * Обработчик изменения полей формы — сбрасывает подсветку при редактировании
 */
function setupFieldChangeHandlers() {
  const inputFields = document.querySelectorAll('#controls input, #controls select');
  inputFields.forEach(field => {
    field.addEventListener('input', resetFieldHighlights);
    field.addEventListener('change', resetFieldHighlights);
  });
}

// Инициализация обработчиков изменений полей формы после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  setupFieldChangeHandlers();
  console.log('Обработчики изменений полей формы инициализированы');
});

/**
 * Функция для быстрой проверки корректности одного поля
 * @param {string} fieldId — ID поля формы
 * @param {number} value — значение для проверки
 * @param {number} min — минимальное допустимое значение
 * @param {number} max — максимальное допустимое значение
 * @param {string} errorMessage — сообщение об ошибке
 * @returns {string|null} — сообщение об ошибке или null, если всё корректно
 */
function validateField(fieldId, value, min, max, errorMessage) {
  if (isNaN(value) || value < min || value > max) {
    return errorMessage;
  }
  return null;
}

/**
 * Универсальная функция валидации с использованием validateField
 * @returns {boolean} — true, если все данные корректны
 */
function validateInputsUniversal() {
  const validationRules = [
    {
      field: 'pageCount',
      min: 1,
      max: 100,
      message: 'Количество страниц должно быть числом от 1 до 100'
    },
    {
      field: 'fontSize',
      min: 16,
      max: 36,
      message: 'Размер шрифта чисел должен быть числом от 16 до 36 pt'
    },
    {
      field: 'outerBorder',
      min: 1,
      max: 10,
      message: 'Толщина внешней рамки должна быть числом от 1 до 10 px'
    },
    {
      field: 'innerBorder',
      min: 1,
      max: 5,
      message: 'Толщина внутренней рамки должна быть числом от 1 до 5 px'
    },
    {
      field: 'borderSpacing',
      min: 0,
      max: 20,
      message: 'Расстояние между рамками должно быть числом от 0 до 20 px'
    },
    {
      field: 'cardWidthTenths',
      min: 1060,
      max: 2120,
      message: 'Ширина карточки (в десятых мм) должна быть числом от 1060 до 2120'
    },
    {
      field: 'cardHeightTenths',
      min: 350,
      max: 1060,
      message: 'Высота карточки (в десятых мм) должна быть числом от 350 до 1060'
    },
    {
      field: 'verticalSpacing',
      min: 7,
      max: 150,
      message: 'Вертикальное расстояние должно быть числом от 7 до 150 pt'
    },
    {
      field: 'dateTimeFontSize',
      min: 1,
      max: 20,
      message: 'Размер шрифта даты/времени должен быть числом от 1 до 20 pt'
    },
    {
      field: 'numberFontSize',
      min: 8,
      max: 36,
      message: 'Размер шрифта номеров должен быть числом от 8 до 36 pt'
    },
    {
      field: 'footerMargin',
      min: -50,
      max: 50,
      message: 'Отступ нижнего колонтитула должен быть числом от −50 до 50 pt'
    }
  ];

  const errors = [];

  validationRules.forEach(rule => {
    const value = parseInt(document.getElementById(rule.field).value, 10);
    const error = validateField(rule.field, value, rule.min, rule.max, rule.message);
    if (error) {
      errors.push(error);
      console.warn(error);
    }
  });

  // Проверка шрифта
  const fontFamily = document.getElementById('fontFamily').value.trim();
  const supportedFonts = ['Helvetica', 'HelveticaBold', 'Helvetica-Oblique', 'Helvetica-BoldOblique'];
  if (!fontFamily) {
    errors.push('Обязательно выберите шрифт для карточек');
    console.warn('Шрифт не выбран');
  } else if (!supportedFonts.includes(fontFamily)) {
    errors.push(`Поддерживаются только шрифты: ${supportedFonts.join(', ')}`);
    console.warn('Неподдерживаемый шрифт:', fontFamily);
  }

  if (errors.length > 0) {
    highlightInvalidFields(errors);
    showStatus('Ошибки в настройках: ' + errors.join('; '), 'error');
    return false;
  }

  return true;
}
