export class Render{
 constructor(){ 
  this.CANVAS = document.createElement("canvas");
  this.CANVAS.setAttribute("class", "tfJsHp-canvas");
  document.body.appendChild(this.CANVAS);
  this.CANVAS.width = window.innerWidth;
  this.CANVAS.height = window.innerHeight;
  this.CONTEXT = this.CANVAS.getContext("2d");
 }
//---------------
// DRAWS A RED CIRCLE WITH FIXED RADIUS
//---------------
  draw(beginX, beginY) {
    this.CONTEXT.beginPath();
    this.CONTEXT.arc(beginX, beginY, 8, 0, 2 * Math.PI, false);
    this.CONTEXT.closePath();
    this.CONTEXT.fillStyle = 'red';
    this.CONTEXT.fill();
    this.CONTEXT.strokeStyle = "red";
    this.CONTEXT.lineWidth = 3;
    this.CONTEXT.stroke();
  }
width(){
  return this.CANVAS.width;
}
height(){
  return this.CANVAS.height;
}
canvas(){
  return this.CANVAS;
}
//---------------
// ERASES CURRENT STATE OF CANVAS 
//---------------
  clear(){
    this.CONTEXT.clearRect(0, 0, this.CANVAS.width, this.CANVAS.height); 
  }

};