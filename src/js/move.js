import 'babel-polyfill';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {Render} from './draw';
let detector;
let video;
let INPUTS = [];
let OUTPUTS = [];
let rafId = 0;
let display_text = document.getElementById('screen_cue');
let step = 0; 
//---------------
// SETUP CANVAS TO BE USED FOR RENDERING POINTER AND ANNOTATIONS
//---------------
let render  = new Render();
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
  await calibrate();
 //await main();
};

init();
//---------------
// SAMPLE 3D CO-ORDS OF WRIST, INDEX, THUMB
// FROM FOUR CORNERS OF SCREEN AND TOP-LEFT FROM MIDWAY IN THE SCREEN
//---------------
let sample_size;
let target;
let prompt;
async function calibrate(){
  if(step == 0){
    render.draw(20,20);
    sample_size = 30;
    target = [0,0];
    prompt = "point at top left";
    await collectSamples();
  }
 
  else if(step == 1){
   
   render.draw(render.width() - 40, 20);
    cancelAnimationFrame(rafId);
    sample_size = 60;
    target = [1,0];
    prompt = "point at top right";
    await collectSamples();
  }
 else if(step == 2){
    render.draw(render.width() - 40, render.height() - 20);
    cancelAnimationFrame(rafId);
    sample_size = 90;
    target = [1,1];
    prompt = "bottom right";
    await collectSamples();
  }
 else if(step == 3){
    render.draw(20, render.height() - 20);
    cancelAnimationFrame(rafId);
    sample_size = 120;
    target = [0,1];
    prompt = "point at bottom left";
    await collectSamples();
  }
  else if(step == 4){
    render.draw(Math.floor(render.width()/2), Math.floor(render.height()/2));
    cancelAnimationFrame(rafId);
    sample_size = 150;
    target = [0.5,0.5];
    prompt = "point in the middle";
    await collectSamples();
  }
   else if(step == 5){
    render.draw(Math.floor(render.width()/2), 20);
    cancelAnimationFrame(rafId);
    sample_size = 180;
    target = [0.5,0];
    prompt = "point in middle top";
    await collectSamples();
  }
   else if(step == 6){
    render.draw(Math.floor(render.width()/2),Math.floor(render.height()));
    cancelAnimationFrame(rafId);
    sample_size = 210;
    target = [0.5,1];
    prompt = "point at middle bottom";
    await collectSamples();
  }
  else{
    cancelAnimationFrame(rafId);
    sample_size = 0;
    target = null;
    step = 0;
    display_text.innerText = "Sampling done, loading model...";
    await trainModel();
  }
}
let raf=0;
async function main(){
  //console.log(prompt); 
  let VIDEO = document.getElementById('webcam');
  const estimationConfig = {flipHorizontal: true};
  const timestamp = performance.now();
  const poses = await detector.estimatePoses(VIDEO, estimationConfig);
  if(poses.length > 0){
     console.log(poses[0].keypoints[8].y, poses[0].keypoints[10].y);
  }
 raf = requestAnimationFrame(main);
 //console.log(raf);
}
async function collectSamples(){
  //console.log(prompt);
  
  let VIDEO = document.getElementById('webcam');
  console.log("size "+ sample_size);
  console.log(step, INPUTS.length);
  const estimationConfig = {flipHorizontal: true};
  const timestamp = performance.now();
  const poses = await detector.estimatePoses(VIDEO, estimationConfig);
  display_text.innerText = prompt;
  if(poses.length > 0 && INPUTS.length < sample_size && poses[0].keypoints[10].score > 0.32 ){
    //console.log(poses[0].keypoints[8].score, poses[0].keypoints[10].score);
   //if( poses[0].keypoints[10].score > 0.32 ){
      //let index_x = poses[0].keypoints[8].x; 
      //let index_y = poses[0].keypoints[8].y;
     let wrist_x = poses[0].keypoints[10].x; 
     let wrist_y = poses[0].keypoints[10].y; 
        INPUTS.push([wrist_x, wrist_y])
        OUTPUTS.push(target);
   //}
    
  }
  if(INPUTS.length < sample_size){
    rafId = requestAnimationFrame(collectSamples);
    //console.log(rafId);
  }
  else{
    step +=1;
    display_text.innerHTML = "";
    render.clear();
    setTimeout(calibrate, 3000);
  }
}

async function trainModel() {
  console.log("start training");
  // Input features - these are 2 dimensional,
  // but could be 6 to represent 2 x 3D co-ords on finger.
  // Would just need to update model definition below.

  // Shuffle the two arrays to remove any order, but do so in the same way so
  // inputs still match outputs indexes.
  tf.util.shuffleCombo(INPUTS, OUTPUTS);

  // Input feature Array of Arrays needs 2D tensor to store.
  const INPUTS_TENSOR = tf.tensor2d(INPUTS);
  const NORMALIZED_INPUTS = normalize(INPUTS_TENSOR);

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
  let modelHp = tf.sequential();
  // Note: Would need to change input shape
  // if 6 dimensional instead of 2 dimensional inputs.
  modelHp.add(tf.layers.dense({ inputShape: [2], units: 12, kernelRegularizer:tf.regularizers.l2(), activation: "relu" }));
  // output layer must be 2 dimensional -
  //  representing 2d screen co-ordinate trying to predict.
  modelHp.add(tf.layers.dense({ units: 2}));
  modelHp.summary();

  await train();
  
  
  async function train() {
    // Compile the model with the defined learning rate and specify
    // our loss function to use.
    modelHp.compile({
      optimizer: "adam",
      loss: "meanSquaredError",
    });

    // Finally do the training itself
    const results = await modelHp.fit(NORMALIZED_INPUTS.NORMALIZED_VALUES, OUTPUTS_TENSOR, {
      shuffle: true,
      batchSize: 15,
      epochs: 100,
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
    display_text.innerText = "Model ready!";
    await evaluate();
  }

     
  async function evaluate() {
   const video = document.getElementById("webcam");
   const estimationConfig = {flipHorizontal: true};
   const timestamp = performance.now();
   const poses = await detector.estimatePoses(video, estimationConfig);
    if(poses.length > 0 && poses[0].keypoints[10].score > 0.32 ){
       tf.tidy(function() {
          let x_wrist = poses[0]?.keypoints[10].x;
          let y_wrist = poses[0]?.keypoints[10].y;
          const output = modelHp.predict(
            normalize(tf.tensor2d([[x_wrist, y_wrist]]), NORMALIZED_INPUTS.MIN_VALUES, NORMALIZED_INPUTS.MAX_VALUES).NORMALIZED_VALUES
            ).squeeze().arraySync();
          // draw on the screen the pointer corresponding to the predicted screen coordinate
          const screenX = Math.floor(Math.abs(output[0] * window.innerWidth));
          const screenY = Math.floor(Math.abs(output[1] * window.innerHeight));
          render.clear();
          render.draw(screenX, screenY);
          console.log(screenX, screenY);
        });
    }
    requestAnimationFrame(evaluate);
  }
  
}