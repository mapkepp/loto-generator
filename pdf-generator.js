/**
 * Модуль генерации PDF для Русского Лотто
 * Версия: 1.0.1 (исправление ошибок инициализации)
 */

// Убеждаемся, что PDFLib загружен глобально
if (typeof PDFLib === 'undefined') {
  console.error('pdf-generator.js: Библиотека PDFLib не загружена! Проверьте тег <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"> в index.html');
  throw new Error('PDFLib not loaded');
}

class PDFGenerator {
  constructor() {
    this.DOWNLOAD_TIMEOUT = 2000; // мс — время мониторинга скачивания
    this.CLEANUP_DELAY = 1000;  // мс — задержка на очистку
    console.log('PDFGenerator: инициализирован');

    // Проверяем доступность ключевых API браузера
    this.checkBrowserSupport();
  }

  /**
   * Проверка поддержки браузером необходимых API
   */
  checkBrowserSupport() {
    const checks = [
      { name: 'Blob API', condition: typeof Blob !== 'undefined' },
      { name: 'URL API', condition: typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined' },
      { name: 'PDFLib', condition: typeof PDFLib !== 'undefined' }
    ];

    const failedChecks = checks.filter(check => !check.condition);
    if (failedChecks.length > 0) {
      failedChecks.forEach(check => console.error(`PDFGenerator: ${check.name} не поддерживается`));
      throw new Error(`Browser lacks required APIs: ${failedChecks.map(c => c.name).join(', ')}`);
    }
    console.log('PDFGenerator: все необходимые API поддерживаются');
  }

  /**
   * Основная функция генерации PDF
   * @returns {Promise<boolean>} true если успешно, false в случае ошибки
   */
  async generatePDF() {
    console.log('PDFGenerator: начало генерации PDF...');

    try {
      const config = this.getConfig();
      console.log('PDFGenerator: конфигурация получена:', config);

      const { PDFDocument, rgb } = PDFLib; // Распаковка необходимых частей PDFLib
      const pdfDoc = await PDFDocument.create();
      console.log('PDFGenerator: создан новый PDF документ');

      // Загружаем шрифт
      const font = await this.loadFont(pdfDoc, config.fontFamily);
      console.log(`PDFGenerator: шрифт загружен: ${config.fontFamily}`);

      let globalCardCounter = 1;
      const cardsPerPage = 4; // Фиксировано 4 карточки на страницу

      for (let pageIndex = 0; pageIndex < config.pageCount; pageIndex++) {
        console.log(`PDFGenerator: создаём страницу ${pageIndex + 1} из ${config.pageCount}`);

        const page = pdfDoc.addPage([595, 842]); // Формат A4

        for (let i = 0; i < cardsPerPage; i++) {
          const card = this.generateLotoCard();
          console.log(`PDFGenerator: генерируем карточку №${globalCardCounter}`);

          const { x, y } = this.calculateCardPosition(i, page);
          this.drawCard(page, card, x, y, config, font, globalCardCounter);
          globalCardCounter++;
        }
      }

      // Сохраняем и запускаем скачивание
      await this.saveAndDownloadPDF(pdfDoc);
      return true;

    } catch (error) {
      console.error('PDFGenerator: фатальная ошибка при генерации PDF:', error);
      throw error; // Перебрасываем ошибку наверх для обработки в script.js
    }
  }

  /**
   * Загрузка шрифта в PDF документ
   * @param {PDFDocument} pdfDoc - экземпляр PDF документа
   * @param {string} fontFamily - имя шрифта (например, 'Helvetica')
   * @returns {Promise<PDFLib.Font>} загруженный шрифт
   */
  async loadFont(pdfDoc, fontFamily) {
    try {
      const font = await pdfDoc.embedFont(StandardFonts[fontFamily]);
      return font;
    } catch (fontError) {
      console.error(`PDFGenerator: не удалось загрузить шрифт ${fontFamily}:`, fontError);
      // Падаем обратно на Helvetica, если заданный шрифт недоступен
      const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      console.warn(`PDFGenerator: использован запасной шрифт: Helvetica`);
      return fallbackFont;
    }
  }

  /**
   * Генерация одной карточки лото (массив чисел)
   * @returns {number[]} массив из 5 уникальных чисел от 1 до 90
   */
  generateLotoCard() {
    const numbers = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 90) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  /**
   * Рассчёт позиции карточки на странице
   * @param {number} cardIndex - индекс карточки (0-3)
   * @param {PDFLib.Page} page - объект страницы PDF
   * @returns {{x: number, y: number}} координаты левого верхнего угла карточки
   */
  calculateCardPosition(cardIndex, page) {
    const cardWidth = 140;
    const cardHeight = 180;
    const margin = 20;

    const col = cardIndex % 2; // 0 или 1 (два столбца)
    const row = Math.floor(cardIndex / 2); // 0 или 1 (две строки)

    const x = margin + col * (cardWidth + margin);
    const y = page.getHeight() - margin - (row + 1) * (cardHeight + margin);

    return { x, y };
  }

  /**
   * Рисование одной карточки лото
   * @param {PDFLib.Page} page - страница PDF
   * @param {number[]} cardNumbers - массив чисел карточки
   * @param {number} x - X-координата левого верхнего угла
   * @param {number} y - Y-координата левого верхнего угла
   * @param {Object} config - конфигурация генерации
   * @param {PDFLib.Font} font - загруженный шрифт
   * @param {number} cardNumber - порядковый номер карточки
   */
  drawCard(page, cardNumbers, x, y, config, font, cardNumber) {
    // Рисуем рамку карточки
    page.drawRectangle({
      x: x,
      y: y,
      width: 140,
      height: 180,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2
    });

    // Рисуем числа карточки
    cardNumbers.forEach((num, i) => {
      const textX = x + 10 + (i % 3) * 40;
      const textY = y + 160 - Math.floor(i / 3) * 50;
      page.drawText(num.toString(), {
        x: textX,
        y: textY,
        size: config.fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });
    });

    // Рисуем номер карточки в углу
    page.drawText(cardNumber.toString(), {
      x: x + 125,
      y: y + 165,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    });
  }

  /**
   * Сохранение PDF и запуск скачивания
   * @param {PDFDocument} pdfDoc - готовый PDF документ
   */
  async saveAndDownloadPDF(pdfDoc) {
  console.log('PDFGenerator: сохраняем PDF...');

  const pdfBytes = await pdfDoc.save();
  console.log(`PDFGenerator: PDF сохранён, размер: ${pdfBytes.length} байт`);

  try {
    // Создаём Blob из байтов PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    console.log('PDFGenerator: Blob создан');

    // Генерируем URL для скачивания
    const url = URL.createObjectURL(blob);
    console.log('PDFGenerator: создан URL для скачивания');

    // Создаём скрытый элемент <a> для запуска скачивания
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `russian-lotto-cards-${new Date().toISOString().replace(/[:T.]/g, '-')}.pdf`);
    document.body.appendChild(link);

    // Эмулируем клик по ссылке для запуска скачивания
    link.click();

    // Очищаем URL и удаляем элемент через таймаут (для безопасности)
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      console.log('PDFGenerator: URL отозван, элемент удалён');
    }, this.DOWNLOAD_TIMEOUT);

    console.log('PDFGenerator: PDF успешно отправлен на скачивание');
  } catch (saveError) {
    console.error('PDFGenerator: ошибка при сохранении/скачивании PDF:', saveError);
    throw new Error('Failed to download PDF: ' + saveError.message);
  }
}

/**
 * Получение конфигурации из DOM (параметры формы)
 * @returns {Object} объект с настройками генерации PDF
 */
getConfig() {
  const config = {
    pageCount: parseInt(document.getElementById('pageCount').value, 10) || 6,
    fontSize: parseInt(document.getElementById('fontSize').value, 10) || 30,
    outerBorder: parseInt(document.getElementById('outerBorder').value, 10) || 4,
    innerBorder: parseInt(document.getElementById('innerBorder').value, 10) || 2,
    borderSpacing: parseInt(document.getElementById('borderSpacing').value, 10) || 3,
    cardWidthTenths: parseInt(document.getElementById('cardWidthTenths').value, 10) || 1965,
    cardHeightTenths: parseInt(document.getElementById('cardHeightTenths').value, 10) || 657,
    verticalSpacing: parseInt(document.getElementById('verticalSpacing').value, 10) || 20,
    dateTimeFontSize: parseInt(document.getElementById('dateTimeFontSize').value, 10) || 3,
    numberFontSize: parseInt(document.getElementById('numberFontSize').value, 10) || 4,
    footerMargin: parseInt(document.getElementById('footerMargin').value, 10) || 5,
    fontFamily: document.getElementById('fontFamily').value || 'Helvetica'
  };

  // Валидация минимальных значений
  Object.keys(config).forEach(key => {
    if (typeof config[key] === 'number' && config[key] < 1) {
      console.warn(`PDFGenerator: некорректное значение ${key}, установлено минимальное`);
      config[key] = 1;
    }
  });

  console.log('PDFGenerator: конфигурация собрана:', config);
  return config;
}
} // конец класса PDFGenerator

// Экспортируем класс в глобальную область (для script.js)
window.PDFGenerator = PDFGenerator;
console.log('pdf-generator.js: модуль PDFGenerator загружен и экспортирован в window.PDFGenerator');
