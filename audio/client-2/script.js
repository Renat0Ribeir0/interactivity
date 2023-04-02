import { Remote } from "https://unpkg.com/@clinth/remote@latest/dist/index.mjs";
import { getMinMaxAvg, getRandomArrayIndex } from '../util.js';

const r = new Remote();


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

    // If there's no frequency data, we're not interested
    if (!freq) return;

    const totalAverage = calculateAverage(freq);
    const bottomEnd = freq.slice(0, 4);
    const topEnd = freq.slice(freq.length - 4, freq.length);

    const averageBottomEnd = calculateAverage(bottomEnd);
    const averageTopEnd = calculateAverage(topEnd);


    const relativeBottom = 1.0 - clamp(scale(averageBottomEnd, -40, -90, 0, 1));

    const hue = (100 * relativeBottom) + 100;
    const hsl = `hsla(${hue}, 100%, 50%, 1)`;

    //console.log(`Total: ${totalAverage} bottom average: ${averageBottomEnd} top average: ${averageTopEnd}`);
    console.log(hsl);

    document.body.style.backgroundColor = hsl;
    //console.log(f);
}


