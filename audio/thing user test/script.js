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

  // Draw thing
  thing.draw(ctx);

  // Apply logic of the thing itself
  thing.exist();

  // Loop again
  window.requestAnimationFrame(loop);
}


function process(d) {
  const t = thing;
  const bins = d.freq.length;

  // ---- Process the data a bit first
  // Get the min, max & average of this waveform
  //   max: absolute max, min: absolute min, avg: average of absolute data
  const waveD = getMinMaxAvg(d.wave, true);
  ampWindow.add(waveD.avg); // Keep track of average readings over time

  const freqD = getMinMaxAvg(d.freq, true); // Get the average of all bins

  // Track how each frequency bin changes over time with lots of sliding windows
  for (var i = 0; i < bins; i++) {
    if (freqWindows[i] === undefined) freqWindows[i] = new SlidingWindow(20);
    freqWindows[i].add(d.freq[i]);
  }

  // ---- Use the processed data to influence the thing
  // 1. Increase rotation if there's a burst of loudness compared to recent
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
    t.deformations[i] += (d * d); // To make it less sensitve, square the result to make it low input values output lower values and vice versa. 
  }


  // 3. Change background color based on the averaging of ALL FFT bins
  let c = 1 - (Math.abs(freqD.avg) / 100);  // Get the average of all bins and make it positive
  c = clamp(c, 0, 1); // Clamp it to 0-1
  c = scale(c, 0, 1, 0, 300) // Scale it to 0-380
  //c = clamp(c, 0, 1); // Clamp it to 0-1
  // Invert the scale so loud sounds produce higher average values and vice versa. Also scale it to 0-180. 
  // IMP: change first value in scale to higher to make it react to softer sounds. 
  //c = scale(c, 80, 40, 0, 180)
  //c = clamp(c, 0, 180) // Ignore negative values and values above 180

  hue = 180 - c; // Subtract the c value from 180 to get the hue value for the background
  hue = clamp(hue, 0, 180); // Make sure that hue is between 0 and 180. 
}

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
