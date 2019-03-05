var test = require('tap').test;
if (typeof window === 'undefined') {
  window = {
    performance: require('perf_hooks').performance
  }
}

var computeStreamlines = require('../');

test('it computes a streamline', (t) => {
  var vectorField = p => ({ x: -p.y, y: p.x });
  var seedPoint = {x: -2, y: 0};
  var boundingBox = {left: -5, top: -5, width: 10, height: 10}
  var addedLines = 0;

  computeStreamlines({
    vectorField,
    seed: seedPoint,
    boundingBox,
    onStreamlineAdded(streamline) {
      t.ok(streamline.length > 1, 'Each streamline has more than two points');
      addedLines += 1;
    }

  }).run().then(() => {
    t.ok(addedLines > 0, 'Some streamlines are found');
    t.end();
  })
})