/**
 * Основной скрипт управления интерфейсом генератора карточек Русского Лотто
 */


// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM полностью загружен, инициализируем приложение...');

  // Получаем экземпляр генератора PDF
  const pdfGenerator = new PDFGenerator();
  console.log('Экземпляр PDFGenerator создан');

  // Находим кнопку генерации в DOM
  const generateBtn = document.getElementById('generateBtn');
  if (!generateBtn) {
    console.error('Кнопка генерации PDF не найдена в DOM');
    return;
  }
  console.log('Кнопка генерации найдена');

  // Функция обработки клика с блокировкой
  const handleGenerateClick = async () => {
    console.log('Обработчик клика: начало выполнения');

    // Блокируем кнопку и меняем текст
    generateBtn.disabled = true;
    const originalText = generateBtn.textContent;
    generateBtn.textContent = 'Генерация... Подождите';
    console.log('Кнопка заблокирована, текст изменён');

    try {
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
      showStatus('Критическая ошибка при генерации PDF', 'error');
    } finally {
      // Разблокируем кнопку через (DOWNLOAD_TIMEOUT + CLEANUP_DELAY)
      setTimeout(() => {
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
        console.log('Кнопка разблокирована, восстановлен исходный текст');
      }, pdfGenerator.DOWNLOAD_TIMEOUT + pdfGenerator.CLEANUP_DELAY);
    }
  };

  // Назначаем обработчик клика на кнопку
  generateBtn.addEventListener('click', handleGenerateClick);
  console.log('Обработчик клика назначен на кнопку генерации');

  // Дополнительная проверка поддержки при загрузке страницы
  if (!pdfGenerator.checkBrowserSupport()) {
    console.warn('Браузер не поддерживает необходимые API');

    // Блокируем кнопку генерации
    generateBtn.disabled = true;
    generateBtn.textContent = 'Не поддерживается в этом браузере';
    generateBtn.style.backgroundColor = '#ccc';
    generateBtn.style.color = '#666';
    generateBtn.title = 'Ваш браузер не поддерживает необходимые API для генерации PDF';

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
    `;
    supportInfo.textContent =
      'Ошибка: не поддерживаются необходимые технологии. Попробуйте открыть в Chrome, Firefox или Safari.';
    document.getElementById('controls').appendChild(supportInfo);
    console.log('Добавлено информационное сообщение о неподдерживаемом браузере');
  } else {
    console.log('Браузер поддерживает все необходимые API');
  }

  // Инициализируем отображение статуса
  initStatusDisplay();
  console.log('Инициализация интерфейса завершена');
});

/**
 * Инициализирует отображение статуса операций
 */
function initStatusDisplay() {
  const statusDiv = document.getElementById('status');
  if (statusDiv) {
    statusDiv.innerHTML = '';
    statusDiv.style.cssText = `
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
      font-weight: bold;
    `;
  }
}

/**
 * Показывает сообщение статуса с указанием типа
 * @param {string} message — текст сообщения
 * @param {string} type — тип сообщения ('success', 'error', 'info')
 */
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;

  let bgColor, textColor;
  switch (type) {
    case 'success':
      bgColor = '#d4edda';
      textColor = '#155724';
      break;
    case 'error':
      bgColor = '#f8d7da';
      textColor = '#721c24';
      break;
    default:
      bgColor = '#d1ecf1';
      textColor = '#0c5460';
  }

  statusDiv.textContent = message;
  statusDiv.style.backgroundColor = bgColor;
  statusDiv.style.color = textColor;

  console.log(`Статус установлен: "${message}" (тип: ${type})`);

  // Автоматически скрываем сообщение через 5 секунд
  setTimeout(() => {
    if (statusDiv.textContent === message) {
      statusDiv.textContent = '';
      statusDiv.style.backgroundColor = '';
      statusDiv.style.color = '';
      console.log('Статус очищен автоматически через 5 секунд');
    }
  }, 5000);
}

/**
 * Валидирует входные данные формы
 * @returns {boolean} — true, если все данные корректны
 */
function validateInputs() {
  const inputs = {
    pageCount: parseInt(document.getElementById('pageCount').value),
    fontSize: parseInt(document.getElementById('fontSize').value),
    outerBorder: parseInt(document.getElementById('outerBorder').value),
    innerBorder: parseInt(document.getElementById('innerBorder').value),
    borderSpacing: parseInt(document.getElementById('borderSpacing').value),
    cardWidthTenths: parseInt(document.getElementById('cardWidthTenths').value),
    cardHeightTenths: parseInt(document.getElementById('cardHeightTenths').value),
    verticalSpacing: parseInt(document.getElementById('verticalSpacing').value),
    dateTimeFontSize: parseInt(document.getElementById('dateTimeFontSize').value),
    numberFontSize: parseInt(document.getElementById('numberFontSize').value),
    footerMargin: parseInt(document.getElementById('footerMargin').value)
  };

  const errors = [];

  // Проверки диапазона значений
  if (inputs.pageCount < 1 || inputs.pageCount > 100) {
    errors.push('Количество страниц должно быть от 1 до 100');
  }
  if (inputs.fontSize < 16 || inputs.fontSize > 36) {
    errors.push('Размер шрифта чисел должен быть от 16 до 36 pt');
  }
  if (inputs.outerBorder < 1 || inputs.outerBorder > 10) {
    errors.push('Толщина внешней рамки должна быть от 1 до 10 px');
  }
  if (inputs.innerBorder < 1 || inputs.innerBorder > 5) {
    errors.push('Толщина внутренней рамки должна быть от 1 до 5 px');
  }
  if (inputs.borderSpacing < 0 || inputs.borderSpacing > 20) {
    errors.push('Расстояние между рамками должно быть от 0 до 20 px');
  }
  if (inputs.cardWidthTenths < 1060 || inputs.cardWidthTenths > 2120) {
    errors.push('Ширина карточки должна быть от 1060 до 2120 десятых мм');
  }
  if (inputs.cardHeightTenths < 350 || inputs.cardHeightTenths > 1060) {
    errors.push('Высота карточки должна быть от 350 до 1060 десятых мм');
  }
  if (errors.length > 0) {
    console.warn('Ошибки валидации:', errors);
    showStatus('Ошибки в настройках: ' + errors.join(', '), 'error');
    return false;
  }

  console.log('Все входные данные прошли валидацию');
  return true;
}
