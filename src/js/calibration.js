import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

let INPUTS = [];
let OUTPUTS = [];
let tempBuffer = [];
let count = 0;
let video;
let model;
let detector;
const prompt = document.getElementById("banner");

let render = (function () {
  const CANVAS = document.createElement("canvas");
  CANVAS.setAttribute("class", "tfJsHp-canvas");
  document.body.appendChild(CANVAS);
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;
  const CONTEXT = CANVAS.getContext("2d");

  function drawCircle(beginX, beginY) {
    CONTEXT.beginPath();
    CONTEXT.arc(beginX, beginY, 8, 0, 2 * Math.PI, false);
    CONTEXT.closePath();
    CONTEXT.strokeStyle = "red";
    CONTEXT.fillStyle = 'red';
    CONTEXT.fill();
    CONTEXT.lineWidth = 3;
    CONTEXT.stroke();
  }
  function clearCanvas(){
    CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height); 
  }
  function removeCircle(beginX, beginY) {
    CONTEXT.beginPath();
    CONTEXT.arc(beginX, beginY, 15, 0, 2 * Math.PI, false);
    CONTEXT.closePath();
    CONTEXT.strokeStyle = "white";
    CONTEXT.fillStyle = 'white';
    CONTEXT.fill();
    CONTEXT.lineWidth = 6;
    CONTEXT.stroke();
  }

  return {
    draw: drawCircle,
    remove: removeCircle,
    canvas: CANVAS,
    clear: clearCanvas,
  };
})();

function logProgress(epoch, data) {
  console.log('Epoch: ' + epoch + ' Data: ',  data);
}

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }
  video = document.getElementById("webcam");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  video.srcObject = stream;
  return new Promise(
    (resolve) => (video.onloadedmetadata = () => resolve(video))
  );
};

async function loadVideo() {
  const video = await setupCamera();
  video.play();
  return video;
};

async function init() {
  video = await loadVideo();
  model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: "tfjs",
    modelType: "full",
  };
  detector = await handPoseDetection.createDetector(model, detectorConfig);
  step1();
};

init();

async function step1() {
  console.log("inside step 1");
  render.draw(20, 20);
  const estimationConfig = { flipHorizontal: true };
  const predictions = await detector.estimateHands(
    document.querySelector("video"),
    estimationConfig
  );
  if (predictions.length > 0) {
    if (count > 3 && INPUTS.length < 30) {
      INPUTS.push([
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
        // predictions[0].keypoints[8].x,
        // predictions[0].keypoints[8].y,
        // predictions[0].keypoints[5].x,
        // predictions[0].keypoints[5].y

      ]);
      OUTPUTS.push([0, 0]);
    } else if (tempBuffer.length > 0) {
      calculateChange(
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
      );
    } else {
      tempBuffer[0] = [
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
      ];
    }
  }
  if (INPUTS.length < 30) {
  
    requestAnimationFrame(step1);
  } else {
    // jump to step2
    console.log(INPUTS.length);
    render.remove(20, 20);
    // console.log(INPUTS.length);
    count = 0;
    tempBuffer = [];
    prompt.innerText = "Put finger in top right";
    step2();
  }
}

function calculateChange(x, y, z, base_x, base_y, base_z) {
  if (
    (Math.abs(tempBuffer[0][0]) - Math.abs(x) < 0.01 &&
    Math.abs(tempBuffer[0][1]) - Math.abs(y) < 0.01 &&
    Math.abs(tempBuffer[0][2]) - Math.abs(z) < 0.01) || (Math.abs(tempBuffer[0][3]) - Math.abs(base_x) < 0.01 &&
    Math.abs(tempBuffer[0][4]) - Math.abs(base_y) < 0.01 &&
    Math.abs(tempBuffer[0][5]) - Math.abs(base_z) < 0.01)
  ) {
    count += 1;
  }
}
async function step2() {
  console.log("inside step 2");
  render.draw(render.canvas.width - 40, 20);
  const estimationConfig = { flipHorizontal: true };
  const predictions = await detector.estimateHands(
    document.querySelector("video"),
    estimationConfig
  );
  if (predictions.length > 0) {
    if (count > 3 && INPUTS.length < 60) {
      INPUTS.push([
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
        // predictions[0].keypoints[8].x,
        // predictions[0].keypoints[8].y,
        // predictions[0].keypoints[5].x,
        // predictions[0].keypoints[5].y
      ]);
      OUTPUTS.push([1,0]);
    } else if (tempBuffer.length > 0) {
      calculateChange(
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
      );
    } else {
      tempBuffer[0] = [
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
      ];
    }
  }
  if (INPUTS.length < 60) {
   
    requestAnimationFrame(step2);
  } else {
    console.log(INPUTS.length);
    render.remove(render.canvas.width - 40, 20);
    console.log(INPUTS.length);
    count = 0;
    tempBuffer = [];
    prompt.innerText = "Put finger in bottom left";
    step3();
  }
}
async function step3() {
  console.log("inside step 3");
  render.draw(20, render.canvas.height - 20);
  const estimationConfig = { flipHorizontal: true };
  const predictions = await detector.estimateHands(
    document.querySelector("video"),
    estimationConfig
  );
  if (predictions.length > 0) {
    if (count > 3 && INPUTS.length < 90) {
      INPUTS.push([
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
        // predictions[0].keypoints[8].x,
        // predictions[0].keypoints[8].y,
        // predictions[0].keypoints[5].x,
        // predictions[0].keypoints[5].y
      ]);
      OUTPUTS.push([1,0]);
    } else if (tempBuffer.length > 0) {
      calculateChange(
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
      );
    } else {
      tempBuffer[0] = [
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
      ];
    }
  }
  if (INPUTS.length < 90) {
 
    requestAnimationFrame(step3);
  } else {
    // jump to step 4
    console.log(INPUTS.length);
    render.remove(20, render.canvas.height - 20);
    count = 0;
    tempBuffer = [];
    prompt.innerText = "Put finger at bottom right";
    step4();
  }
}
async function step4() {
  console.log("inside step 4");
  render.draw(render.canvas.width - 40, render.canvas.height - 20);
  const estimationConfig = { flipHorizontal: true };
  const predictions = await detector.estimateHands(
    document.querySelector("video"),
    estimationConfig
  );
  if (predictions.length > 0) {
    if (count > 3 && INPUTS.length < 120) {
      INPUTS.push([
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
        // predictions[0].keypoints[8].x,
        // predictions[0].keypoints[8].y,
        // predictions[0].keypoints[5].x,
        // predictions[0].keypoints[5].y
      ]);
      OUTPUTS.push([1,1]);
    } else if (tempBuffer.length > 0) {
      calculateChange(
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
      );
    } else {
      tempBuffer[0] = [
        predictions[0].keypoints3D[8].x,
        predictions[0].keypoints3D[8].y,
        predictions[0].keypoints3D[8].z,
        predictions[0].keypoints3D[5].x,
        predictions[0].keypoints3D[5].y,
        predictions[0].keypoints3D[5].z,
      ];
    }
  }
  if (INPUTS.length < 120) {
    requestAnimationFrame(step4);
  } else {
    render.remove(render.canvas.width - 40, render.canvas.height - 20);
    tempBuffer = [];
    prompt.innerText = "put finger at center";
    startTraining();
  }
}
// async function step5() {
//   console.log("inside step 5");
//   render.draw(Math.floor(render.canvas.width/2), Math.floor(render.canvas.height/2));
//   const estimationConfig = { flipHorizontal: true };
//   const predictions = await detector.estimateHands(
//     document.querySelector("video"),
//     estimationConfig
//   );
//   if (predictions.length > 0) {
//     if (count > 3 && INPUTS.length < 250) {
//       INPUTS.push([
//         predictions[0].keypoints3D[8].x,
//         predictions[0].keypoints3D[8].y,
//         predictions[0].keypoints3D[8].z,
//         // predictions[0].keypoints3D[5].x,
//         // predictions[0].keypoints3D[5].y,
//         // predictions[0].keypoints3D[5].z,
//         // predictions[0].keypoints[8].x,
//         // predictions[0].keypoints[8].y,
//         // predictions[0].keypoints[5].x,
//         // predictions[0].keypoints[5].y
//       ]);
//       OUTPUTS.push([0.5,0.5]);
//     } else if (tempBuffer.length > 0) {
//       calculateChange(
//         predictions[0].keypoints3D[8].x,
//         predictions[0].keypoints3D[8].y,
//         predictions[0].keypoints3D[8].z,
//         predictions[0].keypoints3D[5].x,
//         predictions[0].keypoints3D[5].y,
//         predictions[0].keypoints3D[5].z,
//       );
//     } else {
//       tempBuffer[0] = [
//         predictions[0].keypoints3D[8].x,
//         predictions[0].keypoints3D[8].y,
//         predictions[0].keypoints3D[8].z,
//         predictions[0].keypoints3D[5].x,
//         predictions[0].keypoints3D[5].y,
//         predictions[0].keypoints3D[5].z,
//       ];
//     }
//   }
//   if (INPUTS.length < 250) {
//     requestAnimationFrame(step5);
//   } else {
//     render.remove(Math.floor(render.canvas.width/2), Math.floor(render.canvas.height/2));
//     tempBuffer = [];
//     prompt.innerText = "Done !";
//     startTraining();
//   }
// }

function startTraining() {
  console.log("start training");
  // Input features - these are 2 dimensional,
  // but could be 6 to represent 2 x 3D co-ords on finger.
  // Would just need to update model definition below.

  // Shuffle the two arrays to remove any order, but do so in the same way so
  // inputs still match outputs indexes.
  tf.util.shuffleCombo(INPUTS, OUTPUTS);

  // Input feature Array of Arrays needs 2D tensor to store.
  const INPUTS_TENSOR = tf.tensor2d(INPUTS);

  // Output can stay 1 dimensional.
  const OUTPUTS_TENSOR = tf.tensor2d(OUTPUTS);

  // Function to take a Tensor and normalize values
  // with respect to each column of values contained in that Tensor.
  function normalize(tensor, min, max) {
    const result = tf.tidy(function () {
      // Find the minimum value contained in the Tensor.
      const MIN_VALUES = min || tf.min(tensor, 0);

      // Find the maximum value contained in the Tensor.
      const MAX_VALUES = max || tf.max(tensor, 0);

      // Now calculate subtract the MIN_VALUE from every value in the Tensor
      // And store the results in a new Tensor.
      const TENSOR_SUBTRACT_MIN_VALUE = tf.sub(tensor, MIN_VALUES);

      // Calculate the range size of possible values.
      const RANGE_SIZE = tf.sub(MAX_VALUES, MIN_VALUES);

      // Calculate the adjusted values divided by
      // the range size as a new Tensor.
      const NORMALIZED_VALUES = tf.div(TENSOR_SUBTRACT_MIN_VALUE, RANGE_SIZE);

      // Return the important tensors.
      return { NORMALIZED_VALUES, MIN_VALUES, MAX_VALUES };
    });
    return result;
  }

  // Now actually create and define model architecture.
  const modelHp = tf.sequential();
  // Note: Would need to change input shape
  // if 6 dimensional instead of 2 dimensional inputs.
  modelHp.add(tf.layers.dense({ inputShape: [6], units: 64, activation: "relu" }));
  // output layer must be 2 dimensional -
  //  representing 2d screen co-ordinate trying to predict.
  modelHp.add(tf.layers.dense({ units: 2}));
  modelHp.summary();

  train();
  
  
  async function train() {
    // Compile the model with the defined learning rate and specify
    // our loss function to use.
    modelHp.compile({
      optimizer: "adam",
      loss: "meanSquaredError",
    });

    // Finally do the training itself
    const results = await modelHp.fit(INPUTS_TENSOR, OUTPUTS_TENSOR, {
      shuffle: true,
      batchSize: 10,
      epochs: 300,
      validation_split: 0.2,
      callbacks: {onEpochEnd: logProgress}
    });

    OUTPUTS_TENSOR.dispose();
    INPUTS_TENSOR.dispose();

    console.log(
      "Average error loss: " +
        Math.sqrt(results.history.loss[results.history.loss.length - 1])
    );
    // Once trained we can evaluate the model.
    evaluate();
  }

  const estimationConfig = { flipHorizontal: true };
  const VIDEO = document.querySelector("video");
  
  async function evaluate() {
    const predictions = await detector.estimateHands(VIDEO, estimationConfig);
   
    const x = predictions[0]?.keypoints3D[8].x;
    const y = predictions[0]?.keypoints3D[8].y;
    const z = predictions[0]?.keypoints3D[8].z;
    const base_x = predictions[0]?.keypoints3D[5].x;
    const base_y = predictions[0]?.keypoints3D[5].y;
    const base_z = predictions[0]?.keypoints3D[5].z;
    // const x_2d = predictions[0]?.keypoints[8].x;
    // const y_2d = predictions[0]?.keypoints[8].y;
    // const basex_2d = predictions[0]?.keypoints[5].x;
    // const basey_2d = predictions[0]?.keypoints[5].y;


    if (predictions.length > 0 && (x && y && z && base_x && base_y && base_z)) {
      const output = modelHp.predict(tf.tensor2d([[x, y, z, base_x, base_y, base_z]])).squeeze().arraySync();
      // draw on the screen the pointer corresponding to the predicted screen coordinate
      const screenX = Math.floor(Math.abs(output[0] * window.innerWidth));
      const screenY = Math.floor(Math.abs(output[1] * window.innerHeight));
      
      // console.log(screenX + " (" + output[0] +  "), " + screenY + "(" + output[1] + ")");
      render.clear();
      render.draw(screenX, screenY);
    }
   requestAnimationFrame(evaluate);
  }
  
}