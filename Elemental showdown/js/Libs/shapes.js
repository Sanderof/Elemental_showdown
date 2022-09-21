
function drawImg(context, img, sx, sy, sw, sh, x, y, w, h) {
    context.beginPath();
    context.imageSmoothingEnabled = false;
      context.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawImgPlain(context, img, x, y, w, h) {
    context.beginPath();
    context.imageSmoothingEnabled = false;
      context.drawImage(img, x, y, w, h);
}

function writeTxt(context, x, y, txt, font, color) {
    context.beginPath();
      context.fillStyle = color;
      context.font      = font;
      context.fillText(txt, x, y);
}

function drawRect(context, x, y, w, h, strokeColor, fillColor) {
    context.beginPath();
      context.strokeStyle = strokeColor;
      context.fillStyle   = fillColor;
      context.rect(x, y, w, h);
      context.fill();
      context.stroke();
}

function drawFillRect(context, x, y, w, h, color) {
    context.beginPath();
      context.fillStyle = color;
      context.rect(x, y, w, h);
      context.fill();
}

function drawBoxBorders(context, x, y, w, h, color) {
    context.beginPath();
      context.strokeStyle = color;
      context.rect(x, y, w, h);
      context.stroke();
}
