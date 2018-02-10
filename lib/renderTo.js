module.exports = renderTo;

function renderTo(canvas) {
  if (!canvas) throw new Error('Canvas is required');

  var ctx = canvas.getContext('2d');
  var width = canvas.width;
  var height = canvas.height;

  return onPointAdded;

  function onPointAdded(a, b, config) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    a = transform(a, config.boundingBox);
    b = transform(b, config.boundingBox);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.closePath();
  }

  function transform(pt, boundingBox) {
    var tx = (pt.x - boundingBox.left)/boundingBox.width;
    var ty = (pt.y - boundingBox.top)/boundingBox.height;
    return {
      x: tx * width,
      y: (1 - ty) * height
    }
  }
}