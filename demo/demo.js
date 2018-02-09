/* globals streamline */
var canvas = document.getElementById('scene');
var width = window.innerWidth;
var height = window.innerHeight;
canvas.width = width;
canvas.height = height;
var ctx = canvas.getContext('2d');
// ctx.fillStyle = '#18294C';
// ctx.fillRect(0, 0, width, height)
ctx.strokeStyle = 'white';

var vectorField = p => { 
  var l = Math.sqrt(p.x * p.x + p.y * p.y);
  return {
    x: Math.cos(l),
    y: Math.log(Math.abs(p.x))
  };
};
var boundingBox = {left: 0, top: -5, width: 10, height: 10}
var seedPoint = {
  x: boundingBox.left + Math.random() * boundingBox.width,
  y: boundingBox.top + Math.random() * boundingBox.height
}
var velocityMap = makeVelocityMap();

streamline({
  vectorField,
  seed: seedPoint,
  boundingBox,
  stepsPerIteration: 30,
  timeStep: 0.015,
  dSep: 0.25,
  dTest: 0.1,
  onPointAdded,
}).then(streamlines => {
  console.log('done rendering ' + streamlines.length + ' lines')
})

function makeVelocityMap() {
  var dx = boundingBox.width/100;
  var dy = boundingBox.height/100;
  var minV = Number.POSITIVE_INFINITY;
  var maxV = Number.NEGATIVE_INFINITY;
  for (var x = boundingBox.left; x < 100; x += dx) {
    for (var y = boundingBox.top; y < 100; y += dy) {
      var v = vectorField({x, y});
      if (!v) continue;
      if (Number.isNaN(v.x) || Number.isNaN(v.y)) continue;
      var vl = Math.sqrt(v.x * v.x + v.y * v.y);

      if (vl < minV) minV = vl;
      if (vl > maxV) maxV = vl;
    }
  }

  return { minV, maxV }
}

function onPointAdded(a, b) {
  var midPoint = {
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
  }
  var v = vectorField(midPoint);

  ctx.beginPath();
  if (false && v && !(Number.isNaN(v.x) || Number.isNaN(v.y))) {
    var vl = Math.sqrt(v.x * v.x + v.y * v.y);
    var vDiff = velocityMap.maxV - velocityMap.minV;
    var c;
    if (vDiff === 0) c = 0.5;
    else c = vl / vDiff
    var rc = Math.round(182 * c / 3) + 74;
    var gc = Math.round(182 * c / 2) + 74;
    var bc = Math.round(182 * c) + 74;
    ctx.strokeStyle = 'rgb(' + rc + ',' + gc + ',' + bc + ')';
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  a = transform(a);
  b = transform(b);
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.closePath();
  return true;
}

function transform(pt) {
  var tx = (pt.x - boundingBox.left)/boundingBox.width;
  var ty = (pt.y - boundingBox.top)/boundingBox.height;
  return {
    x: tx * width,
    y: (1 - ty) * height
  }
}