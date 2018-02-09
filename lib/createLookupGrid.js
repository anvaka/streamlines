module.exports = createLookupGrid;

class Cell {
  constructor() {
    this.children = null;
  }

  occupy(point) {
    if (!this.children) this.children = [];
    this.children.push(point);
  }

  isTaken(x, y, checkCallback) {
    if (!this.children) return false;

    for(var i = 0; i < this.children.length; ++i) {
      var p = this.children[i];
      var dx = p.x - x, dy = p.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (checkCallback(dist, p)) return true;
    }

    return false;
  }
}

function createLookupGrid(bbox, dSep) {
  var bboxSize = Math.max(bbox.width, bbox.height);

  var cellsCount = Math.ceil(bboxSize / dSep);

  var cells = [];

  var api = {
    occupyCoordinates,
    isTaken,
    isOutside
  };

  return api;

  function isOutside(x, y) {
    return x < bbox.left || x > bbox.left + bbox.width || 
           y < bbox.top || y > bbox.top + bbox.height;
  }

  function occupyCoordinates(point) {
    var x = point.x, y = point.y;
    getCellByCoordinates(x, y).occupy(point);
  }

  function isTaken(x, y, checkCallback) {
    if (!cells) return false;

    var cx = gridX(x);
    var cy = gridY(y);
    for (var col = -1; col < 2; ++col) {
      var currentCellX = cx + col;
      if (currentCellX < 0 || currentCellX >= cellsCount) continue;
      
      var cellRow = cells[currentCellX];
      if (!cellRow) continue;

      for (var row = -1; row < 2; ++row) {
        var currentCellY = cy + row;
        if (currentCellY < 0 || currentCellY >= cellsCount) continue;

        var cellCol = cellRow[currentCellY];
        if(!cellCol) continue;
        if(cellCol.isTaken(x, y, checkCallback)) return true;
      }
    }

    return false;
  }

  function getCellByCoordinates(x, y) {
    assertInBounds(x, y);

    var rowCoordinate = gridX(x);
    var row = cells[rowCoordinate];
    if (!row) {
      row = cells[rowCoordinate] = [];
    }
    var colCoordinate = gridY(y);
    var cell = row[colCoordinate];
    if (!cell) {
      cell = row[colCoordinate] = new Cell();
    }
    return cell;
  }

  function gridX(x) {
    return Math.floor(cellsCount * (x - bbox.left)/bboxSize);
  }

  function gridY(y) {
    return Math.floor(cellsCount * (y - bbox.top)/bboxSize);
  }

  function assertInBounds(x, y) {
    if (bbox.left > x || bbox.left + bboxSize < x ) {
      throw new Error('x is out of bounds');
    }
    if (bbox.top > y || bbox.top + bboxSize < y ) {
      throw new Error('y is out of bounds');
    }
  }
}