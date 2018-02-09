/**
 * Performs Runge-Kutta 4th order integration.
 */
module.exports = rk4;

function rk4(point, timeStep, getVelocity) {
  var k1 = getVelocity(point);
  if (!k1) return;
  var k2 = getVelocity(point.add(k1.mulScalar(timeStep * 0.5)));
  if (!k2) return;
  var k3 = getVelocity(point.add(k2.mulScalar(timeStep * 0.5)));
  if (!k3) return;
  var k4 = getVelocity(point.add(k3.mulScalar(timeStep)));
  if (!k4) return;

  var res = k1.mulScalar(timeStep / 6).add(k2.mulScalar(timeStep/3)).add(k3.mulScalar(timeStep/3)).add(k4.mulScalar(timeStep/6));
  return res;
}