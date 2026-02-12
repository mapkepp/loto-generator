/**
 * Основной скрипт управления интерфейсом генератора карточек Русского Лотто
 * Версия: 1.1.0 (усиленная проверка зависимостей и ошибок)
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
    marginTop: 10px;
    fontStyle: italic;
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
  `;
  console.log('Элемент статуса инициализирован');
}

/**
 * Показывает сообщение статуса с указанием типа
 * @param {string} message — текст сообщения
 * @param {string} type — тип сообщения ('success', 'error', 'info')
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

  console.log(`Статус установлен: "${message}" (тип: ${type})`);

  // Автоматически скрываем сообщение через 5–7 секунд
  setTimeout(() => {
    if (statusDiv.textContent.startsWith(icon)) {
      statusDiv.textContent = '';
      statusDiv.style.backgroundColor = '';
      statusDiv.style.color = '';
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
    errors.push('Размер шрифта чисел должен быть числом от 16 до 36 pt');
    console.warn('Некорректный размер шрифта:', inputs.fontSize);
  }
  if (isNaN(inputs.outerBorder) || inputs.outerBorder < 1 || inputs.outerBorder > 10) {
    errors.push('Толщина внешней рамки должна быть числом от 1 до 10 px');
    console.warn('Некорректная толщина внешней рамки:', inputs.outerBorder);
  }
  if (isNaN(inputs.innerBorder) || inputs.innerBorder < 1 || inputs.innerBorder > 5) {
    errors.push('Толщина внутренней рамки должна быть числом от 1 до 5 px');
    console.warn('Некорректная толщина внутренней рамки:', inputs.innerBorder);
  }
  if (isNaN(inputs.borderSpacing) || inputs.borderSpacing < 0 || inputs.borderSpacing > 20) {
    errors.push('Расстояние между рамками должно быть числом от 0 до 20 px');
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
  if (isNaN(inputs.verticalSpacing) || inputs.verticalSpacing < 0 || inputs.verticalSpacing > 100) {
    errors.push('Вертикальное расстояние должно быть числом от 0 до 100 pt');
    console.warn('Некорректное вертикальное расстояние:', inputs.verticalSpacing);
  }
  if (isNaN(inputs.dateTimeFontSize) || inputs.dateTimeFontSize < 2 || inputs.dateTimeFontSize > 12) {
    errors.push('Размер шрифта даты/времени должен быть числом от 2 до 12 pt');
    console.warn('Некорректный размер шрифта даты/времени:', inputs.dateTimeFontSize);
  }
  if (isNaN(inputs.numberFontSize) || inputs.numberFontSize < 8 || inputs.numberFontSize > 36) {
    errors.push('Размер шрифта номеров должен быть числом от 8 до 36 pt');
    console.warn('Некорректный размер шрифта номеров:', inputs.numberFontSize);
  }
  if (isNaN(inputs.footerMargin) || inputs.footerMargin < 0 || inputs.footerMargin > 50) {
    errors.push('Отступ нижнего колонтитула должен быть числом от 0 до 50 pt');
    console.warn('Некорректный отступ нижнего колонтитула:', inputs.footerMargin);
  }

  // Проверка шрифта
  const fontFamily = document.getElementById('fontFamily').value.trim();
  if (!fontFamily) {
    errors.push('Обязательно выберите шрифт для карточек');
    console.warn('Шрифт не выбран');
  } else if (!['Helvetica', 'Arial', 'Times New Roman', 'Courier'].includes(fontFamily)) {
    errors.push('Поддерживаются только шрифты: Helvetica, Arial, Times New Roman, Courier');
    console.warn('Неподдерживаемый шрифт:', fontFamily);
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
