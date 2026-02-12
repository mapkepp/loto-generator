/**
 * Основной скрипт приложения для генератора карточек Русского Лотто
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('script.js: DOM полностью загружен, инициализируем приложение...');

  // Проверяем доступность PDFGenerator после загрузки всех скриптов
  if (typeof PDFGenerator === 'undefined') {
    console.error('script.js: PDFGenerator не определён. Проверьте порядок загрузки скриптов.');
    alert('Ошибка инициализации приложения: PDFGenerator не загружен. Проверьте консоль (F12 → Console) для деталей.');
    return;
  }

  // Инициализируем генератор PDF
  const pdfGenerator = new PDFGenerator();
  console.log('script.js: PDFGenerator успешно инициализирован');

  // Получаем элементы интерфейса
  const generateBtn = document.getElementById('generateBtn');
  const statusDiv = document.getElementById('status');

  if (!generateBtn) {
    console.error('script.js: Кнопка генерации не найдена в DOM');
    return;
  }

  if (!statusDiv) {
    console.warn('script.js: Элемент статуса не найден в DOM, некоторые уведомления могут не отображаться');
  }

  // Функция обновления статуса
  function updateStatus(message, isError = false) {
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.style.color = isError ? 'red' : 'green';
      statusDiv.style.fontWeight = 'bold';
      console.log(`script.js: Статус обновлён: ${message}`);
    }
  }

  // Обработчик клика по кнопке генерации
  generateBtn.addEventListener('click', async function() {
    console.log('script.js: Нажата кнопка генерации PDF');

    // Сбрасываем предыдущий статус
    updateStatus('Начинаем генерацию PDF...');

    try {
      // Запускаем генерацию PDF
      const success = await pdfGenerator.generatePDF();

      if (success) {
        updateStatus('PDF успешно сгенерирован и отправлен на скачивание!');
        console.log('script.js: Генерация PDF завершена успешно');
      } else {
        updateStatus('Ошибка при генерации PDF. Проверьте консоль для деталей.', true);
        console.error('script.js: Генерация PDF не удалась');
      }
    } catch (error) {
      updateStatus('Критическая ошибка при генерации PDF.', true);
      console.error('script.js: Критическая ошибка в обработчике генерации:', error);
    }
  });

  // Дополнительная валидация конфигурации при старте
  console.log('script.js: Выполняем начальную валидацию конфигурации...');
  try {
    const config = pdfGenerator.getConfig();
    const validationResult = utils.validateConfig(config);

    if (!validationResult.isValid) {
      console.warn('script.js: Обнаружены проблемы в конфигурации:', validationResult.errors);
      validationResult.errors.forEach(error => {
        console.warn('script.js: Ошибка конфигурации:', error);
      });
      updateStatus(`Предупреждение: проблемы с конфигурацией. Проверьте настройки.`, true);
    } else {
      console.log('script.js: Начальная валидация конфигурации пройдена успешно');
    }
  } catch (validationError) {
    console.error('script.js: Ошибка при валидации конфигурации:', validationError);
  }

  console.log('script.js: Приложение инициализировано и готово к работе');
});

// Глобальный обработчик ошибок для отладки
window.addEventListener('error', function(event) {
  console.error('script.js: Глобальная ошибка JavaScript:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('script.js: Необработанное промис-отклонение:', event.reason);
});
