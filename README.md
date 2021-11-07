# streamlines

The library builds streamlines for arbitrary vector fields, trying to keep uniform distance
between them.

![demo](https://i.imgur.com/dC5cN8P.gif)

# usage

You can play with the interactive demo, though keep in mind - it's just a demo created in one night.
True value of this repository is in the library itself :).

Demo is here: https://anvaka.github.io/streamlines

More advanced example is [wind-map](https://anvaka.github.io/wind-lines/) - visualization of the winds
map with evenly spaced streamlines.

## get it

Use it with your favorite bundler:

```
npm install @anvaka/streamlines
```

Or include a precompiled version:

```
https://cdn.jsdelivr.net/gh/anvaka/streamlines@v1.3.0/dist/streamlines.min.js
```

If you are using precompiled version, it will be available under global name `window.streamlines`.

## use it

```js
var vectorField = p => ({ x: -p.y, y: p.x });

streamlines({
  vectorField,
  onPointAdded(from, to) {
    // called when new point is added to a line
    console.log("point created", from, to);
  },
  onStreamlineAdded(points) {
    // Points is just a sequence of points with `x, y` coordinates through which
    // the streamline goes.
    console.log("stream line created. Number of points: ", points.length);
  }
}).run();
```

The library allows you to configure various aspects of computation:

```js

streamlines({
  // Vector field is a function that given a point p returns 2d vector
  // field {x, y}
  vectorField(p) { return p; },

  // Defines bounding box of the vector field
  boundingBox: {left: -5, top: -5, width: 10, height: 10},

  // Defines the first point where integration should start. If this is
  // not specified a random point inside boundingBox is selected
  // You can pass array of seed points, they are going to be used one by one
  // if they satisfy the rules.
  seed: {x: -1, y: 1},

  // Separation distance between new streamlines.
  dSep: 0.5

  // Distance between streamlines when integration should stop.
  dTest: 0.25,

  // Integration time step (passed to RK4 method.)
  timeStep: 0.01,

  // If set to true, lines are going to be drawn from the seed points
  // only in the direction of the vector field
  forwardOnly: false
}).run();
```

The library does not depend on any particular rendering engine, and can be used in the
browser or node.js environment. However, for your convenience and reference I've added
a [simple canvas renderer](https://github.com/anvaka/streamlines/blob/master/lib/renderTo.js):

```js
// Let's assume you have a <canvas id='scene'></canvas> in your document:
var canvas = document.getElementById("scene");

// Then you can render to it with this bit of code:
streamlines({
  // As usual, define your vector field:
  vectorField(p) {
    return { x: -p.y, y: p.x };
  },

  // And print the output to this canvas:
  onPointAdded: streamlines.renderTo(canvas)
}).run();
```

[Here is a JSBin](http://jsbin.com/miwuyav/edit?html,js,output) for you to try.

## Async

The library is asynchronous in its nature. This is done mostly to give you more control
over streamline construction process.

The downside is that it is harder to understand the code. It is written in a way so that
it can be interrupted at almost every computational step.

If you want to cancel rendering, call `dispose` method:

```js
var renderer = streamlines({
  vectorField(p) {
    return p;
  }
});

// Launch the construction
renderer.run();

// something has happened and you want to stop?
renderer.dispose();
```

If you want to understand the algorithm, please [read this paper](http://web.cs.ucdavis.edu/~ma/SIGGRAPH02/course23/notes/papers/Jobard.pdf) - the library follows it closely.

## More examples

* https://github.com/anvaka/noisylines - renders streamlines from perlin noise
* https://jsbin.com/kuluvam/1/edit?html,js,output - shows how to set width/color of line segments

# License

MIT
