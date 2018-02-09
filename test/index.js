var test = require('tap').test;
var computeStreamlines = require('../');

test('it computes a streamline', (t) => {
  var vectorField = p => ({ x: -p.y, y: p.x });
  var seedPoint = {x: -2, y: 0};
  var boundingBox = {left: -5, top: -5, width: 10, height: 10}

  computeStreamlines({
    vectorField,
    seed: seedPoint,
    boundingBox
  }).then(streamlines => {
    t.ok(streamlines.length > 0, 'Some streamlines are found');
    streamlines.forEach(streamline => {
      t.ok(streamline.length > 1, 'Each streamline has more than two points');
    });

    t.end();
  })
})