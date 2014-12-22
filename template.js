//
// Input
//
var mousex = 0, mousey = 0, mouseIsDown = false;
function mouseDown(e) {
   mouseIsDown = true;

   mousex = e.pageX;
   mousey = e.pageY;

}
function mouseUp(e) {
   mouseIsDown = false;

   mousex = e.pageX;
   mousey = e.pageY;
}
function mouseMoved(e) {
   mousex = e.pageX;
   mousey = e.pageY;
}

var leftKey = 37, upKey = 38, rightKey = 39, downKey = 40, spaceKey = 32;
function keyDown(e) {
}
function keyUp(e) {
}

//
// World
//
function init() {
}

function update() {
   draw();
}

function draw() {
   // Clear
   context.fillStyle = "#0f0"
   context.fillRect(0, 0, canvas.width, canvas.height);
   
}

//
// Init
//
var constants = new Array();     // constants from game_vars object
function getConstantsFromDOM() {
   var form = document.getElementById("game_vars");

   for (var i = 0; i < form.elements.length; i++) {
      var name = form.elements[i].name;
      var value = form.elements[i].value;

      // Try to convert to float, if valid
      constants[name] = parseFloat(value) ? parseFloat(value) : value;
   }
}

window.onload = function() {
   canvas = document.getElementById("game");
   context = canvas.getContext("2d");

   canvas.onmousedown = mouseDown;
   canvas.onmouseup = mouseUp;
   canvas.onmousemove = mouseMoved;
   document.onkeydown = keyDown;
   document.onkeyup = keyUp;

   getConstantsFromDOM();
   init();

   setInterval(update, 10);
}
