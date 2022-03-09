import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {Render} from './draw';

let video = document.createElement('video');
let min;
let max;
let model;
video.setAttribute('width', '600px');
video.setAttribute('height', '600px');
video.setAttribute('class', 'tfJs-video');
let detector;
let render = new Render();

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }
 render.canvas().appendChild(video);
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
  video = await setupCamera();
  video.play();
  return video;
};
//---------------
// INITIALIZE MODEL TO USE TENSORFLOW JS VERSION
// ONCE MODEL IS READY CALL DETECTOR TO PREDICT HAND MOVEMENTS
//---------------
async function init() {
  video = await loadVideo();
  const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
  await predict();
};

init();

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

async function predict() {
  console.log("inside predict");
  const estimationConfig = {flipHorizontal: true};
  const timestamp = performance.now();
  const poses = await detector.estimatePoses(video, estimationConfig);
   if(poses.length > 0 && poses[0].keypoints[10].score > 0.32 ){
      tf.tidy(function() {
         let x_wrist = poses[0]?.keypoints[10].x;
         let y_wrist = poses[0]?.keypoints[10].y;
         const output = model.predict(normalize(tf.tensor2d([[x_wrist, y_wrist]]), min, max).NORMALIZED_VALUES).squeeze().arraySync();
         // draw on the screen the pointer corresponding to the predicted screen coordinate
         const screenX = Math.floor(Math.abs(output[0] * window.innerWidth));
         const screenY = Math.floor(Math.abs(output[1] * window.innerHeight));
         render.clear();
         render.draw(screenX, screenY);
         console.log(screenX, screenY);
       });
   }
   requestAnimationFrame(predict);
 }
