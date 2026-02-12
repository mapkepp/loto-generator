/**
 * Модуль генерации PDF для Русского Лотто
 */
class PDFGenerator {
  constructor() {
    this.DOWNLOAD_TIMEOUT = 2000; // мс — время мониторинга скачивания
    this.CLEANUP_DELAY = 1000;  // мс — задержка на очистку
  }

  async generatePDF() {
    console.log('Начало генерации PDF...');

    if (!this.checkBrowserSupport()) {
      console.error('Браузер не поддерживает необходимые API');
      return false;
    }

    try {
      const config = this.getConfig();
      console.log('Конфигурация получена:', config);

      const { PDFDocument } = PDFLib;
      const pdfDoc = await PDFDocument.create();
      console.log('Создан новый PDF документ');

      // Загружаем шрифт
      const font = await this.loadFont(pdfDoc, config.fontFamily);
      console.log('Шрифт загружен:', config.fontFamily);

      let globalCardCounter = 1;

      for (let pageIndex = 0; pageIndex < config.pageCount; pageIndex++) {
        console.log(`Создаём страницу ${pageIndex + 1} из ${config.pageCount}`);
        const page = pdfDoc.addPage([595, 842]); // A4

        const cardsPerColumn = this.calculateCardsPerPage(config);
        console.log(`Карточек на странице: ${cardsPerColumn}`);

        for (let row = 0; row < cardsPerColumn; row++) {
          const card = this.generateLotoCard();
          console.log(`Генерируем карточку №${globalCardCounter}`);

          const { cardX, cardY } = this.calculateCardPosition(page, row, config);
          this.drawCard(page, card, cardX, cardY, config, font, globalCardCounter);
          globalCardCounter++;
        }
      }

      await this.saveAndDownloadPDF(pdfDoc);
      return true;
    } catch (error) {
      console.error('Ошибка при генерации PDF:', error);
      alert('Произошла ошибка при генерации PDF. Проверьте консоль (F12 → Console) для деталей.');
      return false;
    }
  }

  checkBrowserSupport() {
    const checks = [
      { name: 'Blob API', condition: typeof Blob !== 'undefined' },
      { name: 'URL API', condition: typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined' },
      { name: 'PDFLib', condition: typeof PDFLib !== 'undefined' }
    ];

    const failedChecks = checks.filter(check => !check.condition);
    if (failedChecks.length > 0) {
      failedChecks.forEach(check => console.error(`${check.name} не поддерживается`));
      return false;
    }
    console.log('Все необходимые API поддерживаются');
    return true;
  }

  getConfig() {
    return {
      pageCount: parseInt(document.getElementById('pageCount').value),
      fontSize: parseInt(document.getElementById('fontSize').value),
      outerBorder: parseInt(document.getElementById('outerBorder').value),
      innerBorder: parseInt(document.getElementById('innerBorder').value),
      borderSpacing: parseInt(document.getElementById('borderSpacing').value),
      cardWidth: Math.round(parseInt(document.getElementById('cardWidthTenths').value) * 0.283464567),
      cardHeight: Math.round(parseInt(document.getElementById('cardHeightTenths').value) * 0.283464567),
      verticalSpacing: parseInt(document.getElementById('verticalSpacing').value),
      dateTimeFontSize: parseInt(document.getElementById('dateTimeFontSize').value),
      numberFontSize: parseInt(document.getElementById('numberFontSize').value),
      footerMargin: parseInt(document.getElementById('footerMargin').value)
    };
  }

  async loadFont(pdfDoc, fontFamily) {
    switch (fontFamily) {
      case 'Helvetica':
        return await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      case 'HelveticaBold':
        return await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      case 'Helvetica-Oblique':
        return await pdfDoc.embedFont(PDFLib.StandardFonts['Helvetica-Oblique']);
      case 'Helvetica-BoldOblique':
        return await pdfDoc.embedFont(PDFLib.StandardFonts['Helvetica-BoldOblique']);
      default:
        return await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    }
  }

  calculateCardsPerPage(config) {
    const pageHeight = 842; // A4 высота в pt
    const availableHeight = pageHeight - 0; // отступы сверху/снизу
    return Math.floor(availableHeight / (config.cardHeight + config.verticalSpacing));
  }

  calculateCardPosition(page, rowIndex, config) {
    const pageHeight = page.getSize().height;
    const cardY = pageHeight - (rowIndex + 1) * (config.cardHeight + config.verticalSpacing) - 0;
    const cardX = (page.getSize().width - config.cardWidth) / 2;
    return { cardX, cardY };
  }

  generateLotoCard() {
    const card = [Array(9).fill(0), Array(9).fill(0), Array(9).fill(0)];
    const columnRanges = [
      [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
      [50, 59], [60, 69], [70, 79], [80, 90]
    ];

    const generateValidCard = () => {
      const tempCard = [Array(9).fill(0), Array(9).fill(0), Array(9).fill(0)];
      for (let col = 0; col < 9; col++) {
        const [min, max] = columnRanges[col];
        const numbersInColumn = Array.from(
          ({ length: max - min + 1 },
          (_, i) => i + min
        );
        const numCount = Math.floor(Math.random() * 2) + 1;
        const selectedNumbers = [];
        for (let i = 0; i < numCount; i++) {
          const randomIndex = Math.floor(Math.random() * numbersInColumn.length);
          const num = numbersInColumn[randomIndex];
          selectedNumbers.push(num);
          numbersInColumn.splice(randomIndex, 1);
        }
        for (const num of selectedNumbers) {
          let row;
          do {
            row = Math.floor(Math.random() * 3);
          } while (tempCard[row][col] !== 0);
          tempCard[row][col] = num;
        }
      }
      const isValid = tempCard.every(row => row.filter(n => n !== 0).length === 5);
      return isValid ? tempCard : generateValidCard();
    };
    return generateValidCard();
  }

  drawCard(page, card, x, y, config, font, cardNumber) {
    const blackColor = PDFLib.rgb(0, 0, 0);
    const cellWidth = config.cardWidth / 9;
    const cellHeight = config.cardHeight / 3;

    // Рисуем двойную рамку карточки
    this.drawDoubleBorder(page, x, y, config.cardWidth, config.cardHeight,
      config.outerBorder, config.innerBorder, config.borderSpacing, blackColor);
    console.log('Двойная рамка нарисована');

    // Рисуем ячейки и числа
    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
      for (let colIndex = 0; colIndex < 9; colIndex++) {
        const num = card[rowIndex][colIndex];

                // Центр ячейки
        const xCenter = x + colIndex * cellWidth + cellWidth / 2;
        const yCenter = y + (2 - rowIndex) * cellHeight + cellHeight / 2;

        // Внутренняя сетка
        page.drawRectangle({
          x: x + colIndex * cellWidth,
          y: y + (2 - rowIndex) * cellHeight,
          width: cellWidth,
          height: cellHeight,
          borderColor: blackColor,
          borderWidth: 0.5,
        });

        if (num !== 0) {
          const text = num.toString();
          const textWidth = font.widthOfTextAtSize(text, config.fontSize);
          const x = xCenter - textWidth / 2;

          // Адаптивный вертикальный сдвиг в зависимости от размера шрифта
          let k;
          if (config.fontSize <= 22) {
            k = 0.35;
          } else if (config.fontSize <= 28) {
            k = 0.35 - (config.fontSize - 22) * (0.05 / 6);
          } else {
            k = 0.30 - (config.fontSize - 28) * (0.05 / 8);
          }

          const y = yCenter - config.fontSize * k;

          page.drawText(text, {
            x: x,
            y: y,
            size: config.fontSize,
            font: font,
            color: blackColor,
          });
          console.log(`Число ${text} нарисовано в ячейке [${rowIndex},${colIndex}]`);
        }
      }
    }

    // Добавляем метку внизу карточки
    this.drawCardLabel(page, x, y, config, font, cardNumber);
    console.log('Метка карточки добавлена');
  }

  drawDoubleBorder(page, x, y, width, height, outerBorderWidth, innerBorderWidth, spacing, color) {
    console.log('Рисуем двойную рамку:', { x, y, width, height, outerBorderWidth, innerBorderWidth, spacing });

    // Внешняя рамка
    page.drawRectangle({
      x: x,
      y: y,
      width: width,
      height: height,
      borderColor: color,
      borderWidth: outerBorderWidth,
    });

    // Внутренняя рамка (с отступом на spacing + половина толщины внешней линии)
    const innerX = x + spacing + outerBorderWidth / 2;
    const innerY = y + spacing + outerBorderWidth / 2;
    const innerWidth = width - 2 * (spacing + outerBorderWidth / 2);
    const innerHeight = height - 2 * (spacing + outerBorderWidth / 2);

    page.drawRectangle({
      x: innerX,
      y: innerY,
      width: innerWidth,
      height: innerHeight,
      borderColor: color,
      borderWidth: innerBorderWidth,
    });
  }

  drawCardLabel(page, cardX, cardY, config, font, cardNumber) {
    const blackColor = PDFLib.rgb(0, 0, 0);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    const dateTimeStr = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
    const numberStr = ` ${cardNumber}`;

    const footerY = cardY + config.footerMargin;

    // Дата и время
    const dateTimeTextWidth = font.widthOfTextAtSize(dateTimeStr, config.dateTimeFontSize);
    const dateTimeX = cardX + (config.cardWidth - dateTimeTextWidth - 5) / 2;
    page.drawText(dateTimeStr, {
      x: dateTimeX,
      y: footerY,
      size: config.dateTimeFontSize,
      font: font,
      color: blackColor,
    });
    console.log('Дата и время метки нарисованы:', dateTimeStr);

    // Номер карточки
    const numberTextWidth = font.widthOfTextAtSize(numberStr, config.numberFontSize);
    const numberX = dateTimeX + dateTimeTextWidth + 3; // Расстояние между датой и номером
    page.drawText(numberStr, {
      x: numberX,
      y: footerY,
      size: config.numberFontSize,
      font: font,
      color: blackColor,
    });
    console.log('Номер карточки метки нарисован:', cardNumber);
  }

  async saveAndDownloadPDF(pdfDoc) {
    try {
      console.log('Начинаем сохранение PDF...');
      const pdfBytes = await pdfDoc.save();
      console.log('PDF сохранён, размер:', pdfBytes.length, 'байт');

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      let url;
      try {
        url = URL.createObjectURL(blob);
        console.log('Blob URL создан:', url);
      } catch (urlError) {
        console.error('Ошибка создания blob URL:', urlError);
        alert('Не удалось создать ссылку для скачивания. Попробуйте обновить страницу.');
        return;
      }

      // Создание ссылки для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.download = 'loto_cards.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      console.log('Ссылка для скачивания создана');

      // Попытка скачать файл через клик
      try {
        link.click();
        console.log('Клик по ссылке инициирован');
      } catch (clickError) {
        console.error('Ошибка при клике по ссылке:', clickError);
      }

      // Мониторинг скачивания
      const checkInterval = 400;
      let attempts = 0;
      const maxAttempts = Math.floor(this.DOWNLOAD_TIMEOUT / checkInterval);

      const monitorDownload = setInterval(() => {
        attempts++;
        console.log(`Попытка скачивания: ${attempts}/${maxAttempts}`);

        if (attempts >= maxAttempts) {
          clearInterval(monitorDownload);
          console.warn('Таймаут скачивания, открываем PDF в новой вкладке');

          try {
            window.open(url, '_blank');
          } catch (openError) {
            console.error('Ошибка открытия в новой вкладке:', openError);
            alert('Попробуйте открыть PDF вручную: нажмите на ссылку в новой вкладке.');
          }
        }
      }, checkInterval);

      // Очистка ресурсов
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
          clearInterval(monitorDownload);
          console.log('Ресурсы очищены');
        } catch (cleanupError) {
          console.error('Ошибка при очистке ресурсов:', cleanupError);
        }
      }, this.DOWNLOAD_TIMEOUT + this.CLEANUP_DELAY);
    } catch (saveError) {
      console.error('Ошибка сохранения PDF:', saveError);
      alert('Произошла ошибка при сохранении PDF. Проверьте консоль (F12 → Console) для деталей.');
    }
  }
}

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PDFGenerator;
} else {
  window.PDFGenerator = PDFGenerator;
}
