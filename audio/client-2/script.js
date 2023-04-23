import AudioBase from '../util/AudioBase.js';

import { Remote } from "https://unpkg.com/@clinth/remote@latest/dist/index.mjs";
import { clamp, scale, getMinMaxAvg, getRandomArrayIndex } from '../util.js';


const r = new Remote({

    // If you're running your sketch locally and connecting to
    // a Glitch-hosted processor:
    // url: 'wss://your-project.glitch.me/ws'
    //remote: true,
    useSockets: false,
    useBroadcastChannel: true,
    //ourId: 'clint',
    //websocket: `wss://nvvi2.glitch.me/ws`,
    //allowNetwork: true
});
// Hack in AudioBase.js to change data processing
const a = new AudioBase();



function calculateAverage(freq) {
    if (freq.length == 0) throw Error('Hey your array is empty');
    let total = 0;
    for (let i = 0; i < freq.length; i++) {
        total += freq[i];
    }
    const average = total / freq.length;
    return average;
}

// When data is received from the Remote, do something with it...
r.onData = (d) => {
    //console.log(d);
    const freq = d.freq;
    const wave = d.wave;
    const index = 5;

    // If there's no frequency data, we're not interested
    if (!freq) return;

    const frequency = a.getFrequencyAtIndex(index);

    const totalAverage = calculateAverage(freq);
    const bottomEnd = freq.slice(0, 4);
    const topEnd = freq.slice(freq.length - 4, freq.length);

    //Using the phone to detect hissing with mouth shape
    //const bottomEnd = freq.slice(29, 36);
    //const topEnd = freq.slice(50, 57);

    const averageBottomEnd = calculateAverage(bottomEnd);
    const averageTopEnd = calculateAverage(topEnd);


    const relativeBottom = 1.0 - clamp(scale(averageBottomEnd, -45, -100, 0, 1));
    const relativeTop = 1.0 - clamp(scale(averageTopEnd, -40, -160, 0, 1));

    let hue;

    // Check if the value of relativeBottom is greater than 0.5
    if (relativeBottom > 0.5) {
        // Calculate the hue value based on the distance between relativeBottom and 1
        // `100/relativeBottom` creates a number that is larger when relativeBottom is smaller, and smaller when relativeBottom is larger.
        // `100 - (100 / relativeBottom)` subtracts this ratio from 100
        hue = Math.abs(100 - (100 / relativeBottom));
    }
    else if (relativeTop > 0.5) {
        hue = 100 + (100 * relativeTop);
    }
    else {
        hue = 100; // Or some other default value
    }


    //const hue = (100 * relativeBottom) + 100;

    const hsl = `hsla(${hue}, 100%, 50%, 1)`;

    //console.log(`Total: ${totalAverage} bottom average: ${averageBottomEnd} top average: ${averageTopEnd}`);
    console.log(`relative bottom average: ${relativeBottom} relative top average: ${relativeTop}`);
    //console.log(hsl);
    //console.log(freq);


    document.body.style.backgroundColor = hsl;
    //console.log(f);
}


