const generatePDF = async () => {
  try {
    if (!checkBrowserSupport()) {
      alert(
        'Ваш браузер не поддерживает необходимые технологии для генерации PDF.\n' +
        'Попробуйте: \n' +
        '1. Обновить Яндекс Браузер до последней версии\n' +
        '2. Открыть страницу в Safari или Chrome\n' +
        '3. Проверить интернет-соединение (PDFLib должен загрузиться)'
      );
      return;
    }

    const pageCount = parseInt(document.getElementById('pageCount').value);
    const fontSize = parseInt(document.getElementById('fontSize').value);

    // Параметры двойной рамки
    const outerBorder = parseInt(document.getElementById('outerBorder').value); // толщина внешней линии
    const innerBorder = parseInt(document.getElementById('innerBorder').value); // толщина внутренней линии
    const borderSpacing = parseInt(document.getElementById('borderSpacing').value); // расстояние между линиями

    const tenthsToPt = 0.283464567;
    const cardHeightInput = parseInt(document.getElementById('cardHeightTenths').value);
    const cardHeight = Math.round(cardHeightInput * tenthsToPt);
    const cardWidthInput = parseInt(document.getElementById('cardWidthTenths').value);
    const cardWidth = Math.round(cardWidthInput * tenthsToPt);
    const verticalSpacing = parseInt(document.getElementById('verticalSpacing').value);

    // Размеры шрифтов для метки
    const dateTimeFontSize = parseInt(document.getElementById('dateTimeFontSize').value);
    const numberFontSize = parseInt(document.getElementById('numberFontSize').value);

    // Расстояние от нижней рамки карточки до метки (в pt)
    const footerMargin = parseInt(document.getElementById('footerMargin').value);

    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const pageWidth = 595;  // A4 ширина в pt
    const pageHeight = 842; // A4 высота в pt

    // Считываем выбранный шрифт
    const fontFamily = document.getElementById('fontFamily').value;
    let font;
    switch (fontFamily) {
      case 'Helvetica':
        font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        break;
      case 'HelveticaBold':
        font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        break;
      case 'Helvetica-Oblique':
        font = await pdfDoc.embedFont(PDFLib.StandardFonts['Helvetica-Oblique']);
        break;
      case 'Helvetica-BoldOblique':
        font = await pdfDoc.embedFont(PDFLib.StandardFonts['Helvetica-BoldOblique']);
        break;
      default:
        font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    }

    const blackColor = PDFLib.rgb(0, 0, 0);

    // Счётчик номеров карточек (сквозной по всем страницам)
    let globalCardCounter = 1;

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Расчёт количества карточек на странице по вертикали
      const cardsPerColumn = Math.floor((pageHeight - 0) / (cardHeight + verticalSpacing));

      for (let row = 0; row < cardsPerColumn; row++) {
        const card = generateLotoCard();
        const cardY = pageHeight - (row + 1) * (cardHeight + verticalSpacing) - 0;
        const cardX = (pageWidth - cardWidth) / 2;

        // Рисуем двойную рамку карточки
        drawDoubleBorder(page, cardX, cardY, cardWidth, cardHeight, outerBorder, innerBorder, borderSpacing, blackColor);

        const cellWidth = cardWidth / 9;
        const cellHeight = cardHeight / 3;

        // Рисуем ячейки и числа
        for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
          for (let colIndex = 0; colIndex < 9; colIndex++) {
            const num = card[rowIndex][colIndex];

            // Центр ячейки
            const xCenter = cardX + colIndex * cellWidth + cellWidth / 2;
            const yCenter = cardY + (2 - rowIndex) * cellHeight + cellHeight / 2;

            // Внутренняя сетка
            page.drawRectangle({
              x: cardX + colIndex * cellWidth,
              y: cardY + (2 - rowIndex) * cellHeight,
              width: cellWidth,
              height: cellHeight,
              borderColor: blackColor,
              borderWidth: innerBorder,
            });

            if (num !== 0) {
              const text = num.toString();
              const textWidth = font.widthOfTextAtSize(text, fontSize);
              const x = xCenter - textWidth / 2;

              // Адаптивный вертикальный сдвиг
              let k;
              if (fontSize <= 22) {
                k = 0.35;
              } else if (fontSize <= 28) {
                k = 0.35 - (fontSize - 22) * (0.05 / 6);
              } else {
                k = 0.30 - (fontSize - 28) * (0.05 / 8);
              }

              const y = yCenter - fontSize * k;

              page.drawText(text, {
                x: x,
                y: y,
                size: fontSize,
                font: font,
                color: blackColor,
              });
            }
          }
        }

        // Метка внизу карточки
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        const dateTimeStr = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
        const numberStr = ` ${globalCardCounter}`;

        const footerY = cardY + footerMargin;
        const dateTimeTextWidth = font.widthOfTextAtSize(dateTimeStr, dateTimeFontSize);
        const dateTimeX = cardX + (cardWidth - dateTimeTextWidth - 5) / 2;
        page.drawText(dateTimeStr, {
          x: dateTimeX,
          y: footerY,
          size: dateTimeFontSize,
          font: font,
          color: blackColor,
        });

        const numberTextWidth = font.widthOfTextAtSize(numberStr, numberFontSize);
        const numberX = dateTimeX + dateTimeTextWidth + 3; // Расстояние между датой и номером
        page.drawText(numberStr, {
          x: numberX,
          y: footerY,
          size: numberFontSize,
          font: font,
          color: blackColor,
        });

        globalCardCounter++; // Увеличиваем счётчик
      }
    }

    // Сохранение и скачивание PDF
    try {
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      let url;
      try {
        url = URL.createObjectURL(blob);
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

            // Попытка скачать файл через клик
      try {
        link.click();
      } catch (clickError) {
        console.error('Ошибка при клике по ссылке:', clickError);
      }

      // Мониторинг скачивания (на случай, если клик не сработал)
      const checkInterval = 400;  // Проверка каждые 400 мс
      let attempts = 0;
      const maxAttempts = Math.floor(DOWNLOAD_TIMEOUT / checkInterval);

      const monitorDownload = setInterval(() => {
        attempts++;

        if (attempts >= maxAttempts) {
          clearInterval(monitorDownload);

          // Если после DOWNLOAD_TIMEOUT файл не скачался — открываем в новой вкладке
          try {
            window.open(url, '_blank');
          } catch (openError) {
            console.error('Ошибка открытия в новой вкладке:', openError);
            alert('Попробуйте открыть PDF вручную: нажмите на ссылку в новой вкладке.');
          }
        }
      }, checkInterval);

      // Очистка: удаление временного URL и ссылки после завершения
      setTimeout(() => {
        try {
          // Освобождаем временный URL
          URL.revokeObjectURL(url);
          
          // Удаляем элемент ссылки из DOM
          document.body.removeChild(link);
          
          // Останавливаем таймер мониторинга (если ещё не остановлен)
          clearInterval(monitorDownload);
          
        } catch (cleanupError) {
          console.error('Ошибка при очистке ресурсов:', cleanupError);
        }
      }, DOWNLOAD_TIMEOUT + CLEANUP_DELAY);

    } catch (saveError) {
      console.error('Ошибка сохранения PDF:', saveError);
      alert(
        'Произошла ошибка при сохранении PDF. Проверьте консоль (F12 → Console) для деталей.'
      );
    }
  } catch (mainError) {
    console.error('Критическая ошибка в generatePDF:', mainError);
    alert(
      'Произошла непредвиденная ошибка при генерации PDF.\n' +
      'Проверьте консоль (F12 → Console) или попробуйте:\n' +
      '1. Обновить страницу\n' +
      '2. Проверить интернет-соединение\n' +
      '3. Открыть в другом браузере (Chrome/Safari)'
    );
  }
};

/**
 * Функция для отрисовки двойной рамки карточки
 * @param {PDFPage} page — страница PDF
 * @param {number} x — координата X левого верхнего угла
 * @param {number} y — координата Y левого верхнего угла
 * @param {number} width — ширина рамки
 * @param {number} height — высота рамки
 * @param {number} outerBorderWidth — толщина внешней линии
 * @param {number} innerBorderWidth — толщина внутренней линии
 * @param {number} spacing — расстояние между линиями
 * @param {RGB} color — цвет линий
 */
const drawDoubleBorder = (page, x, y, width, height, outerBorderWidth, innerBorderWidth, spacing, color) => {
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
};

// Инициализация: назначаем обработчик кнопки после объявления функции
document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  
  if (generateBtn) {
    // Функция обработки клика с блокировкой
    const handleGenerateClick = async () => {
      // Блокируем кнопку и меняем текст
      generateBtn.disabled = true;
      generateBtn.textContent = 'Генерация... Подождите';
      
      try {
        await generatePDF(); // Вызываем основную функцию
      } catch (err) {
        console.error('Ошибка при генерации PDF:', err);
      }
      
      // Разблокируем кнопку через (DOWNLOAD_TIMEOUT + CLEANUP_DELAY)
      const totalDelay = DOWNLOAD_TIMEOUT + CLEANUP_DELAY;
      setTimeout(() => {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Сгенерировать PDF';
      }, totalDelay);
    };
    
    generateBtn.addEventListener('click', handleGenerateClick);
    
    // Дополнительная проверка поддержки при загрузке страницы
    if (!checkBrowserSupport()) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Не поддерживается в этом браузере';
      generateBtn.style.backgroundColor = '#ccc';
      generateBtn.style.color = '#666';
      generateBtn.title = 'Ваш браузер не поддерживает необходимые API для генерации PDF';

      const supportInfo = document.createElement('div');
      supportInfo.style.color = 'red';
      supportInfo.style.marginTop = '10px';
      supportInfo.style.fontStyle = 'italic';
      supportInfo.textContent =
        'Ошибка: не поддерживаются необходимые технологии. Попробуйте открыть в Chrome или Safari.';
      document.getElementById('controls').appendChild(supportInfo);
    }
  } else {
    console.error('Кнопка генерации PDF не найдена в DOM');
  }
});
