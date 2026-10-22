(function () {
  'use strict';
  const engine = window.LotoUniqueEngine;
  const $ = id => document.getElementById(id);
  const button = $('generateBtn');
  const status = $('unique-status');
  const downloadArea = $('unique-download');
  let activeUrl = null;
  let busy = false;

  function report(message, isError) {
    status.textContent = message;
    status.style.color = isError ? '#9b1c1c' : '#23543b';
  }
  function intField(id, min, max) {
    const raw = $(id).value.trim();
    const n = Number(raw);
    if (!/^[-+]?\d+$/.test(raw) || !Number.isSafeInteger(n) || n < min || n > max) {
      throw new Error('Поле «' + ($(id).dataset.name || id) + '»: допустимо число от ' + min + ' до ' + max);
    }
    return n;
  }
  function params() {
    const result = {
      pageCount: intField('pageCount', 1, 200),
      fontFamily: $('fontFamily').value,
      fontSize: intField('fontSize', 16, 36),
      outerBorder: intField('outerBorder', 1, 10),
      innerBorder: intField('innerBorder', 1, 5),
      cardWidth: intField('cardWidthTenths', 1060, 2070) * 72 / 254,
      cardHeight: intField('cardHeightTenths', 350, 1060) * 72 / 254,
      spacing: intField('verticalSpacing', 7, 150),
      dateFontSize: intField('dateTimeFontSize', 1, 20),
      indexFontSize: intField('numberFontSize', 1, 20),
      footerMargin: intField('footerMargin', 0, 30)
    };
    if (!['Helvetica','HelveticaBold','Helvetica-Oblique','Helvetica-BoldOblique'].includes(result.fontFamily)) {
      throw new Error('Неподдерживаемый шрифт');
    }
    if (result.cardWidth > 587) throw new Error('Карточка слишком широкая для А4: уменьшите ширину.');
    result.cardsPerPage = Math.floor(830 / (result.cardHeight + result.spacing));
    if (result.cardsPerPage < 1) throw new Error('Карточка не помещается на А4: уменьшите высоту или интервал.');
    result.cardCount = result.pageCount * result.cardsPerPage;
    if (result.cardCount > engine.MAX_CARDS) throw new Error('Слишком много карточек для одного файла (максимум ' + engine.MAX_CARDS + '). Уменьшите число страниц.');
    return result;
  }
  function a4Label(date) {
    const part = n => String(n).padStart(2,'0');
    return date.getFullYear() + part(date.getMonth()+1) + part(date.getDate()) +
      part(date.getHours()) + part(date.getMinutes()) + part(date.getSeconds());
  }
  function renderCard(page, font, card, number, p, stamp) {
    const ink = PDFLib.rgb(0, 0, 0);
    const cellWidth = p.cardWidth / 9, cellHeight = p.cardHeight / 3;
    const cardX = (595 - p.cardWidth) / 2;
    const rowIndex = (number - 1) % p.cardsPerPage;
    const cardY = 842 - (rowIndex + 1) * (p.cardHeight + p.spacing);
    if (cardY < 1 || cardX < 3) throw new Error('Положение карточки выходит за границы А4');
    page.drawRectangle({x:cardX,y:cardY,width:p.cardWidth,height:p.cardHeight,
      borderColor:ink,borderWidth:p.outerBorder});
    for (let r=0; r<3; r++) for(let c=0; c<9; c++) {
      const x=cardX+c*cellWidth, y=cardY+(2-r)*cellHeight;
      page.drawRectangle({x,y,width:cellWidth,height:cellHeight,borderColor:ink,borderWidth:p.innerBorder});
      const n=card[r][c];
      if (!n) continue;
      const txt=String(n);
      const size=Math.min(p.fontSize,(cellWidth-8)*p.fontSize/font.widthOfTextAtSize(txt,p.fontSize),cellHeight*0.68);
      const textWidth=font.widthOfTextAtSize(txt,size);
      page.drawText(txt,{x:x+(cellWidth-textWidth)/2,y:y+(cellHeight-size)/2+size*0.14,size,font,color:ink});
    }
    const footerY=cardY + Math.min(Math.max(p.footerMargin, 2), Math.max(2,cellHeight-24));
    const stampSize=Math.min(p.dateFontSize, 12);
    const serialText=' / ' + number;
    const tw=font.widthOfTextAtSize(stamp,stampSize);
    const iw=font.widthOfTextAtSize(serialText,p.indexFontSize);
    const totalWidth=tw+iw+3;
    const scale=Math.min(1,(p.cardWidth-10)/Math.max(totalWidth,1));
    const left=cardX+(p.cardWidth-totalWidth*scale)/2;
    page.drawText(stamp,{x:left,y:footerY,size:stampSize*scale,font,color:ink});
    page.drawText(serialText,{x:left+tw*scale+3,y:footerY,size:p.indexFontSize*scale,font,color:ink});
  }
  async function generatePdf(deck, p) {
    const pdf=await PDFLib.PDFDocument.create();
    const fonts={
      Helvetica:PDFLib.StandardFonts.Helvetica,
      HelveticaBold:PDFLib.StandardFonts.HelveticaBold,
      'Helvetica-Oblique':PDFLib.StandardFonts.HelveticaOblique,
      'Helvetica-BoldOblique':PDFLib.StandardFonts.HelveticaBoldOblique
    };
    const font=await pdf.embedFont(fonts[p.fontFamily]);
    const stamp=a4Label(new Date());
    for(let i=0;i<p.pageCount;i++) {
      const page=pdf.addPage([595,842]);
      for(let j=0;j<p.cardsPerPage;j++) {
        const index=i*p.cardsPerPage+j;
        renderCard(page,font,deck.cards[index],index+1,p,stamp);
      }
      if (i%3===0 || i===p.pageCount-1) {
        report('Подготовка PDF: ' + (i+1) + ' из ' + p.pageCount + ' стр. · ' + deck.stats.count + ' уникальных карточек');
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
    }
    return await pdf.save();
  }
  async function run() {
    if(busy) return;
    busy=true; button.disabled=true;button.textContent='Генерация…';
    if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl=null;}
    downloadArea.replaceChildren();
    try {
      if(!engine || !window.PDFLib || typeof PDFLib.PDFDocument.create!=='function') {
        throw new Error('Не загрузилась библиотека PDF. Проверьте подключение к интернету и перезагрузите страницу.');
      }
      const p=params();
      report('Распределяем числа 1–90 и проверяем уникальность…');
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const deck=engine.generateDeck(p.cardCount);
      if(deck.stats.unique!==p.cardCount||deck.stats.maxNumberUses-deck.stats.minNumberUses>1) {
        throw new Error('Проверка набора не пройдена; PDF не создан.');
      }
      const bytes=await generatePdf(deck,p);
      const blob=new Blob([bytes],{type:'application/pdf'});
      activeUrl=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=activeUrl;
      link.download='russkoe_loto_unique_'+p.cardCount+'_cards.pdf';
      link.textContent='Скачать PDF ещё раз';
      link.style.cssText='display:inline-block;padding:9px 14px;border-radius:6px;border:1px solid #20633d;color:#155a39;font-weight:bold;margin-top:10px;';
      downloadArea.appendChild(link);
      link.click();
      report('Готово: '+p.cardCount+' разных карточек, '+p.pageCount+' стр. А4. Каждое число встречается от '+
        deck.stats.minNumberUses+' до '+deck.stats.maxNumberUses+' раз. Сохраните PDF для повторной печати.');
    } catch (error) {
      console.error('Уникальный генератор:',error);
      report('Не получилось создать PDF: '+(error && error.message ? error.message : 'неизвестная ошибка'),true);
    } finally {
      button.disabled=false;button.textContent='Сгенерировать уникальный PDF';busy=false;
    }
  }
  if (!button || !status || !downloadArea) return;
  button.addEventListener('click',run);
  window.addEventListener('pagehide',()=>{if(activeUrl)URL.revokeObjectURL(activeUrl);});
})();