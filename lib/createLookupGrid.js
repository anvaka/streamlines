var classCallCheck = require('./classCheck');

module.exports = createLookupGrid;

var Cell = function () {
  function Cell() {
    classCallCheck(this, Cell);

    this.children = null;
  }

  Cell.prototype.occupy = function occupy(point) {
    if (!this.children) this.children = [];
    this.children.push(point);
  };

  Cell.prototype.isTaken = function isTaken(x, y, checkCallback) {
    if (!this.children) return false;

    for (var i = 0; i < this.children.length; ++i) {
      var p = this.children[i];
      var dx = p.x - x,
          dy = p.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (checkCallback(dist, p)) return true;
    }

    return false;
  };

  Cell.prototype.getMinDistance = function getMinDistance(x, y) {
    let minDistance = Infinity;

    if (!this.children) return minDistance;

    for (var i = 0; i < this.children.length; ++i) {
      var p = this.children[i];
      var dx = p.x - x,
          dy = p.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    return minDistance;
  }

  return Cell;
}();

function createLookupGrid(bbox, dSep) {
  var bboxSize = Math.max(bbox.width, bbox.height);

  var cellsCount = Math.ceil(bboxSize / dSep);

  var cells = new Map();

  var api = {
    occupyCoordinates: occupyCoordinates,
    isTaken: isTaken,
    isOutside: isOutside,
    findNearest: findNearest
  };

  return api;

  function findNearest(x, y) {
    var cx = gridX(x);
    var cy = gridY(y);
    let minDistance = Infinity;

    for (var col = -1; col < 2; ++col) {
      var currentCellX = cx + col;
      if (currentCellX < 0 || currentCellX >= cellsCount) continue;
      
      var cellRow = cells.get(currentCellX);
      if (!cellRow) continue;

      for (var row = -1; row < 2; ++row) {
        var currentCellY = cy + row;
        if (currentCellY < 0 || currentCellY >= cellsCount) continue;

        var cellCol = cellRow.get(currentCellY);
        if(!cellCol) continue;
        let d = cellCol.getMinDistance(x, y);
        if (d < minDistance) minDistance = d;
      }
    }

    return minDistance;
  }

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
      
      var cellRow = cells.get(currentCellX);
      if (!cellRow) continue;

      for (var row = -1; row < 2; ++row) {
        var currentCellY = cy + row;
        if (currentCellY < 0 || currentCellY >= cellsCount) continue;

        var cellCol = cellRow.get(currentCellY);
        if(!cellCol) continue;
        if(cellCol.isTaken(x, y, checkCallback)) return true;
      }
    }

    return false;
  }

  function getCellByCoordinates(x, y) {
    assertInBounds(x, y);

    var rowCoordinate = gridX(x);
    var row = cells.get(rowCoordinate);
    if (!row) {
      row = new Map();
      cells.set(rowCoordinate, row);
    }
    var colCoordinate = gridY(y);
    var cell = row.get(colCoordinate);
    if (!cell) {
      cell = new Cell();
      row.set(colCoordinate, cell)
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