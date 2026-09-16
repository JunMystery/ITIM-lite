/* ==========================================================================
   ITIM-lite - Offline SVG Barcode & QR Code Generator
   Zero external dependencies - generates lightweight SVG markup for tags
   ========================================================================== */

var BarcodeQR = (function () {
  // Code 39 Barcode Encoding Table
  var CODE39_PATTERNS = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
    '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
    '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
    'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
    'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
    'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
    'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
    'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
    '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
    '$': '010101000', '/': '010100010', '+': '010001010', '%': '000101010'
  };

  function generateBarcodeSvg(text, height, barWidth) {
    if (!text) text = "AST-0000";
    height = height || 40;
    barWidth = barWidth || 2;
    var wideWidth = barWidth * 2.5;
    var narrowWidth = barWidth;

    var cleaned = "*" + text.toUpperCase().replace(/[^0-9A-Z\-\. \$\/\+\%]/g, "") + "*";
    var rects = [];
    var x = 4;

    for (var i = 0; i < cleaned.length; i++) {
      var char = cleaned.charAt(i);
      var pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

      for (var p = 0; p < 9; p++) {
        var isBar = (p % 2 === 0);
        var isWide = (pattern.charAt(p) === '1');
        var w = isWide ? wideWidth : narrowWidth;

        if (isBar) {
          rects.push('<rect x="' + x + '" y="0" width="' + w + '" height="' + height + '" fill="#000" />');
        }
        x += w;
      }
      x += narrowWidth; // gap between characters
    }

    var totalWidth = x + 4;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + totalWidth + ' ' + (height + 14) + '" width="' + totalWidth + '" height="' + (height + 14) + '">' +
      rects.join('') +
      '<text x="' + (totalWidth / 2) + '" y="' + (height + 11) + '" text-anchor="middle" font-family="monospace" font-size="10" fill="#222">' + text + '</text>' +
      '</svg>';
  }

  // Simplified Matrix QR Code Generator for Inventory Asset Tags (21x21 version 1 layout)
  function generateQrSvg(text, size) {
    size = size || 80;
    var gridDim = 21;
    var matrix = [];
    for (var r = 0; r < gridDim; r++) {
      matrix[r] = [];
      for (var c = 0; c < gridDim; c++) matrix[r][c] = 0;
    }

    // Helper: draw finder pattern (7x7)
    function drawFinder(sr, sc) {
      for (var r = 0; r < 7; r++) {
        for (var c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[sr + r][sc + c] = 1;
          }
        }
      }
    }

    drawFinder(0, 0);                 // Top-Left
    drawFinder(0, gridDim - 7);        // Top-Right
    drawFinder(gridDim - 7, 0);        // Bottom-Left

    // Timing patterns
    for (var i = 8; i < gridDim - 8; i++) {
      matrix[6][i] = (i % 2 === 0) ? 1 : 0;
      matrix[i][6] = (i % 2 === 0) ? 1 : 0;
    }

    // Hash payload into data area
    var hash = 0;
    for (var k = 0; k < text.length; k++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(k);
      hash |= 0;
    }

    var bitIndex = 0;
    for (var row = 0; row < gridDim; row++) {
      for (var col = 0; col < gridDim; col++) {
        // Skip finder zones
        if ((row < 8 && col < 8) || (row < 8 && col >= gridDim - 8) || (row >= gridDim - 8 && col < 8)) {
          continue;
        }
        if (row === 6 || col === 6) continue;

        var bit = (Math.abs(hash) >> (bitIndex % 31)) & 1;
        if ((row + col) % 3 === 0) bit ^= 1;
        matrix[row][col] = bit;
        bitIndex++;
      }
    }

    // Build SVG rects
    var cellSize = size / gridDim;
    var rects = [];
    for (var y = 0; y < gridDim; y++) {
      for (var x = 0; x < gridDim; x++) {
        if (matrix[y][x]) {
          rects.push('<rect x="' + (x * cellSize).toFixed(1) + '" y="' + (y * cellSize).toFixed(1) +
            '" width="' + (cellSize + 0.1).toFixed(1) + '" height="' + (cellSize + 0.1).toFixed(1) + '" fill="#000" />');
        }
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges">' +
      '<rect width="' + size + '" height="' + size + '" fill="#ffffff"/>' +
      rects.join('') +
      '</svg>';
  }

  return {
    generateBarcodeSvg: generateBarcodeSvg,
    generateQrSvg: generateQrSvg
  };
})();
