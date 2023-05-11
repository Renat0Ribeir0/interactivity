import { clamp, scale } from '../util.js';

export default class Thing {
  constructor() {
    // Radius
    this.radius = 50;
    // Height & width of goal square
    this.size = 120;
    // Current rotation
    this.rotation = 0;
    // Speed of rotation
    this.rotationVector = 0;

    // Center x,y
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;

    // Goal x,y  (where we should move the circle to)
    this.goalX = window.innerWidth / 3;
    this.goalY = window.innerHeight / 2;



    //Current x position
    //this.xPosition = this.x;
    // Horizontal position vector
    this.xVector = 0;

    // Line segments
    this.deformations = [];
  }

  // Apply the thing's own logic - in this case, the circle moves back to the center
  exist() {
    const t = this;
    const targetX = window.innerWidth / 2;
    const targetR = 50;
    // Mote at a x% rate of the distance to the target. It's faster closer to the edges and slower closer to the center.
    const step = 0.005 * Math.abs(targetX - t.x);
    // moves back by percentage of width/2. Always at same speed
    //const step = 0.0009 * targetX; 
    //const stepR = 0.0001 * targetR;

    // 1.  slows down to zero
    if (Math.abs(t.xVector) < 0.1) {
      // if we're close enough to 0 set it to 0 to avoid oscillation
      t.xVector = 0;
    } else if (t.xVector != 0) {
      // If we're otherwise not zero, slowly reduce speed of movement
      t.xVector = scale(t.xVector, -1, 1, -5, 5) //* 0.99;
    }

    // 2. Circle wants to go back to the center
    if (Math.abs(t.x - targetX) <= 0.1) {
      // If we're close enough to center, set it to center to avoid oscillation
      t.x = targetX;
    } else if (t.x > targetX + 0.1) {
      // If we're to the right from center, slowly come back to the center. Each loop, reduce by step %
      t.x -= step;
    } else if (t.x < targetX - 0.1) {
      // If we're to the left from center, slowly come back to the center. Each loop, increase by step %
      t.x += step;
    }

    /*// 3. Circle wants to get smaller
    if (Math.abs(t.radius - targetR) <= 50.001) {
      // If we're close enough to center, set it to center to avoid oscillation
      t.radius = targetR;
    } else if (t.radius != 50) {
      // If we're to the right from center, slowly come back to the center. Each loop, reduce by step %
      t.radius -= stepR;
    }*/
    // 2. Deformations want to shrink. Each loop, reduce by 30%
    //t.deformations = t.deformations.map(v => v * 0.7);

    // --- Make sure values are within right ranges
    //t.rotationVector = clamp(t.rotationVector, -5, 5);
    //t.deformations = t.deformations.map(v => clamp(v, 0, 5));
    t.xVector = clamp(t.xVector, -10, 10);
    //t.x = clamp(t.x, 0, window.innerWidth);
    t.x = clamp(t.x, t.radius, window.innerWidth - t.radius);


    // Apply movement
    t.x = t.x + (t.xVector);
    // Apply increase in size
    //t.radius = t.radius + (Math.abs(t.xVector));

    //console.log(t.xVector);
  }


  draw(ctx) {
    const t = this;

    ctx.save();

    // 1. Draw our thing (a circle)
    ctx.beginPath(); // Start a new path
    ctx.arc(t.x, t.y, t.radius, 0, 2 * Math.PI); // Draw a circle using the arc method
    ctx.stroke(); // Draw the circle outline

    // 2. Draw our thing (a square)
    const halfSize = t.size / 2;
    ctx.strokeRect(t.goalX - halfSize, t.goalY - halfSize, t.size, t.size);

    // Undo transformations
    ctx.restore();
    ctx.save();

    // 2. Draw new circle at new position
    ctx.beginPath(); // Start a new path
    ctx.arc(t.x, t.y, t.radius, 0, 2 * Math.PI);

    // 3. Draw new square at new position


    // Undo transformations
    ctx.restore();
  }
}

