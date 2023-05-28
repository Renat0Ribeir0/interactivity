
import { Remote } from "https://unpkg.com/@clinth/remote@latest/dist/index.mjs";
import SlidingWindow from '../util/SlidingWindow.js';
import { clamp, scale, getMinMaxAvg } from '../util.js';
import Thing from './Thing.js';



/** @type {CanvasHTMLElement} */
const canvasEl = document.getElementById('canvas');

// Keep track of the last few amplitude readings
const ampWindow = new SlidingWindow(10);
const freqWindows = [];

//Set hue value for the background  
let hue = 180;

const thing = new Thing();

const r = new Remote({
  ourId: 'recent'
});


// Keep running draw loop
function loop() {
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvasEl.getContext('2d');

  // Fill the canvas with cyan but at 5% opacity, to let movement smear
  ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.05)`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw thing and goal square
  thing.draw(ctx);

  // Apply logic of the thing itself
  thing.exist();

  // Apply new position to the goal square

  // Loop again
  window.requestAnimationFrame(loop);
}

function process(d) {
  const t = thing;
  const bins = d.freq.length;
  const freq = d.freq;
  let relativeBottom = 0;
  let relativeTop = 0;

  // ---- Process the data a bit first
  // Get the min, max & average of this waveform
  //   max: absolute max, min: absolute min, avg: average of absolute data
  const waveD = getMinMaxAvg(d.wave, true);
  ampWindow.add(waveD.avg); // Keep track of average readings over time

  // Get the min, max & average of of all bins
  const freqD = getMinMaxAvg(d.freq, true);
  // Get the min, max & average of the bottom 20 bins
  const bottomEnd = getMinMaxAvg(d.freq.slice(4, 15), true)
  // Get the min, max & average of all bins minus the bottom 30
  const topEnd = getMinMaxAvg(d.freq.slice(60, 200), true)

  // Get the average of the bottom end and top end
  const avgBottomEnd = bottomEnd.avg;
  const avgTopEnd = topEnd.avg;

  relativeBottom = scale(avgBottomEnd, 40, 160, 1, 0);
  relativeTop = scale(avgTopEnd, 40, 160, 1, 0);


  //const relativeBottom = 1.0 - clamp(scale(avgBottomEnd, -40, -100, 0, 1));
  //const relativeTop = 1.0 - clamp(scale(avgTopEnd, -40, -100, 0, 1));

  //console.log(`Bottom average: ${avgBottomEnd} top average: ${avgTopEnd}`)
  //console.log(`relative bottom average: ${relativeBottom} relative top average: ${relativeTop}`);

  // Track how each frequency bin changes over time with lots of sliding windows
  for (var i = 0; i < bins; i++) {
    if (freqWindows[i] === undefined) freqWindows[i] = new SlidingWindow(20);
    freqWindows[i].add(d.freq[i]);
  }

  // ---- Use the processed data to influence the thing

  //1. Increase x position if it's high pitch is louder or decrease if it's low pitch is louder

  //Only trigger movement if sound produced is louder than noise floor
  //We can change the trigger point by changing the 0.x value
  //Scaled the values to 0-1 to have a smoother movement. Change to higher value to make slower
  relativeBottom = relativeBottom < 0.6 ? 0 : scale(relativeBottom, 0.6, 1, 0, 1.5);
  relativeTop = relativeTop < 0.6 ? 0 : scale(relativeTop, 0.6, 1, 0, 1.5);

  // If relativeBottom is higher than relativeTop, move to the left and vice versa
  if (relativeBottom > relativeTop) {
    t.xVector = -relativeBottom;
  } else if (relativeBottom < relativeTop) {
    t.xVector = relativeTop;
  }

  //console.log(`relative bottom average: ${relativeBottom} relative top average: ${relativeTop}`);
  //console.log(`x vector: ${t.xVector}`)
  // If relativeBottom is lower than 0

  /*// 1. Increase rotation if there's a burst of loudness compared to recent
  let diff = waveD.avg - ampWindow.avg(); // Will be positive if we're louder, negative if softer
  if (diff > 0.00001) { // Only move if there's enough of a difference & it's louder
    t.rotationVector += diff;
  }

  // 2. Deform the body based on averaging of FFT bins
  for (var i = 0; i < freqWindows.length; i++) {
    const avg = freqWindows[i].avg();
    if (Number.isNaN(avg)) continue; // Don't have data yet

    // FFT bins are in dB (from -120 or so to 0)
    // Flip the scale so it's 0.0->1.0
    let d = 1.0 - (Math.abs(avg) / 100);
    d = clamp(d, 0, 1);

    // Increases deformation by the new average
    if (!t.deformations[i]) t.deformations[i] = 0; // Not yet set
    t.deformations[i] += d;
  }*/


  /*// 3. Change background color based on the averaging of FFT bins
  let c = Math.abs(freqD.avg);  // Get the average of all bins and make it positive
  // Invert the scale so loud sounds produce higher average values and vice versa. Also scale it to 0-180. 
  // IMP: change first value in scale to higher to make ir react to softer sounds. 
  c = scale(c, 80, 40, 0, 180)
  c = clamp(c, 0, 180) // Ignore negative values and values above 180

  hue = 180 - c; // Subtract the c value from 180 to get the hue value for the background*/
}

function getRandomValue(ranges) {
  // Select a random range
  const selectedRange = ranges[Math.floor(Math.random() * ranges.length)];
  const [min, max] = selectedRange;
  return Math.random() * (max - min) + min;
}

function updateRandomValue() {
  const t = thing;
  const ranges = [
    [window.innerWidth / 4.2, window.innerWidth / 2.4],
    [window.innerWidth / 1.7, window.innerWidth / 1.3]
  ];
  t.goalX = getRandomValue(ranges);
  console.log('Random value:', t.goalX);
}

const intervalTime = 7000; // 10 seconds (in milliseconds)

// Call the function initially
updateRandomValue();

// Set an interval to call the function every 10 seconds
setInterval(updateRandomValue, intervalTime);

// Called whenever the window resizes. Fit canvas
function onResize() {
  canvasEl.width = window.innerWidth;
  canvasEl.height = window.innerHeight;
}

function init() {
  window.addEventListener('resize', onResize);

  onResize(); // Initial fitting of canvas

  // Start loop
  window.requestAnimationFrame(loop);

  // When we receive audio analysis, send it to process
  r.onData = (d) => process(d);
}

init();
