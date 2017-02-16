//
// Input
//
var mousex = 0, mousey = 0, mouseIsDown = false;
var mousexOff = 0, mouseyOff = 0, mousexTile, mouseyTile;
function getMousePos(e) {
   if (e.touches) {
      // We only care about one touch at a time
      var touch = e.touches[0];

      if (touch) {
         // Based on: http://www.nogginbox.co.uk/blog/canvas-and-multi-touch
         if (touch.offsetX) {
            // Chrome/Safari (except for iPad/iPhone)
            mousex = touch.offsetX;
            mousey = touch.offsetY;
         }
         else if (touch.layerX) {
            // Firefox
            mousex = touch.layerX;
            mousey = touch.layerY;
         }
         else {
            // Safari on iPad/iPhone
            mousex = touch.pageX - canvas.offsetLeft;
            mousey = touch.pageY - canvas.offsetTop;
         }
      }
   }
   else {
      // Mouse
      mousex = e.pageX;
      mousey = e.pageY;
   }
}
function mouseDown(e) {
   mouseIsDown = true;

   getMousePos(e);

   if (endTime != null) {
      init();
      return;
   }

   var x = Math.floor(mousex / constants.TILE_SIZE);
   if (mousey < constants.BOARD_SIZE * constants.TILE_SIZE) {
      var y = Math.floor(mousey / constants.TILE_SIZE);

      if (pickedUp == null) {
         pickedUp = board[x][y];
         board[x][y] = null;

         mousexOff = x * constants.TILE_SIZE - mousex;
         mouseyOff = y * constants.TILE_SIZE - mousey;
      }
   }
   else if (mousey >= shuffledY) {
      var y = Math.floor((mousey - shuffledY) / constants.TILE_SIZE);

      if (pickedUp == null) {
         pickedUp = shuffled[x][y];
         shuffled[x][y] = null;

         mousexOff = x * constants.TILE_SIZE - mousex;
         mouseyOff = y * constants.TILE_SIZE + shuffledY - mousey;
      }
   }

   draw();
}
function mouseUp(e) {
   mouseIsDown = false;

   getMousePos(e);

   var x = Math.floor(mousex / constants.TILE_SIZE);
   if (mousey < constants.BOARD_SIZE * constants.TILE_SIZE) {
      var y = Math.floor(mousey / constants.TILE_SIZE);

      var current = board[x][y];
      if (current == null) {
         board[x][y] = pickedUp;
         pickedUp = null;
      }
   }
   else if (mousey >= shuffledY) {
      var y = Math.floor((mousey - shuffledY) / constants.TILE_SIZE);

      var current = shuffled[x][y];
      if (current == null) {
         shuffled[x][y] = pickedUp;
         pickedUp = null;
      }
   }

   draw();
}
function mouseMoved(e) {
   getMousePos(e);

   if (endTime != null) {
      return;
   }

   mousexTile = Math.floor(mousex / constants.TILE_SIZE);
   mouseyTile = Math.floor(mousey / constants.TILE_SIZE);

   draw();
}

function keyDown(e) {
}
function keyUp(e) {
}

//
// World
//
var colors;
var board;
var solution;
var shuffled;
var pickedUp = null;
var shuffledY;
var startTime, endTime;
function Tile() {
   this.left = this.top = this.right = this.bottom = 0;

   this.draw = function(x, y) {
      context.strokeStyle = "#000";

      var size = constants.TILE_SIZE;

      // If we're in the board area, light up the matching sides
      var boardX = Math.floor((x + size/2) / size);
      var boardY = Math.floor((y + size/2) / size);
      var inBoard = boardX < constants.BOARD_SIZE && boardY < constants.BOARD_SIZE;


      // Top
      if (inBoard && boardY > 0) {
         var above = board[boardX][boardY-1];
         
         if (above == null) {
            if (pickedUp != null && mousexTile == boardX && mouseyTile == boardY-1) {
               above = pickedUp;
            }
         }

         if (above == null || above.bottom != this.top) {
            context.globalAlpha = constants.DISCONNECTED_ALPHA;
         }
      }
      context.beginPath(); {
         context.fillStyle = colors[this.top];
         context.moveTo(x, y);
         context.lineTo(x + size, y);
         context.lineTo(x + size/2, y + size/2);
         context.fill();
         context.stroke();
      }
      context.closePath();
      context.globalAlpha = 1;

      // Left
      if (inBoard && boardX > 0) {
         var toLeft = board[boardX-1][boardY];

         if (toLeft == null) {
            if (pickedUp != null && mousexTile == boardX-1 && mouseyTile == boardY) {
               toLeft = pickedUp;
            }
         }
         
         if (toLeft == null || toLeft.right != this.left) {
            context.globalAlpha = constants.DISCONNECTED_ALPHA;
         }
      }
      context.beginPath(); {
         context.fillStyle = colors[this.left];
         context.moveTo(x, y);
         context.lineTo(x, y + size);
         context.lineTo(x + size/2, y + size/2);
         context.fill();
         context.stroke();
      }
      context.closePath();
      context.globalAlpha = 1;

      // Right
      if (inBoard && boardX < constants.BOARD_SIZE - 1) {
         var toRight = board[boardX+1][boardY];

         if (toRight == null) {
            if (pickedUp != null && mousexTile == boardX+1 && mouseyTile == boardY) {
               toRight = pickedUp;
            }
         }
         
         if (toRight == null || toRight.left != this.right) {
            context.globalAlpha = constants.DISCONNECTED_ALPHA;
         }
      }
      context.beginPath(); {
         context.fillStyle = colors[this.right];
         context.moveTo(x + size, y);
         context.lineTo(x + size, y + size);
         context.lineTo(x + size/2, y + size/2);
         context.fill();
         context.stroke();
      }
      context.closePath();
      context.globalAlpha = 1;

      // Bottom
      if (inBoard && boardY < constants.BOARD_SIZE - 1) {
         var below = board[boardX][boardY+1];

         if (below == null) {
            if (pickedUp != null && mousexTile == boardX && mouseyTile == boardY+1) {
               below = pickedUp;
            }
         }
         
         if (below == null || below.top != this.bottom) {
            context.globalAlpha = constants.DISCONNECTED_ALPHA;
         }
      }
      context.beginPath(); {
         context.fillStyle = colors[this.bottom];
         context.moveTo(x, y + size);
         context.lineTo(x + size, y + size);
         context.lineTo(x + size/2, y + size/2);
         context.fill();
         context.stroke();
      }
      context.closePath();
      context.globalAlpha = 1;
   }
}

function init() {
   // Update board layout when constants change
   shuffledY = (1 + constants.BOARD_SIZE) * constants.TILE_SIZE;

   // Prepare pieces, board and area for shuffled pieces
   solution = new Array(constants.BOARD_SIZE);
   board = new Array(constants.BOARD_SIZE);
   shuffled = new Array(constants.BOARD_SIZE);
   for (var x = 0; x < constants.BOARD_SIZE; x ++) {
      solution[x] = new Array(constants.BOARD_SIZE);
      board[x] = new Array(constants.BOARD_SIZE);
      shuffled[x] = new Array(constants.BOARD_SIZE);
      for (var y = 0; y < constants.BOARD_SIZE; y ++) {
         var tile = new Tile();
         solution[x][y] = tile;
      }
   }

   // Generate solution
   for (var x = 0; x <= constants.BOARD_SIZE; x ++) {
      for (var y = 0; y <= constants.BOARD_SIZE; y ++) {
         if (y < constants.BOARD_SIZE) {
            var col = Math.floor(Math.random() * constants.NUM_COLORS);
            if (x < constants.BOARD_SIZE)
               solution[x][y].left = col;
            if (x > 0)
               solution[x-1][y].right = col;
         }

         if (x < constants.BOARD_SIZE - 1) {
            col = Math.floor(Math.random() * constants.NUM_COLORS);
            if (y < constants.BOARD_SIZE)
               solution[x][y].top = col;
            if (y > 0)
               solution[x][y-1].bottom = col;
         }
      }
   }

   // Move pieces from solution to shuffled area
   var pieces = new Array();

   for (var x = 0; x < constants.BOARD_SIZE; x ++) {
      for (var y = 0; y < constants.BOARD_SIZE; y ++) {
         pieces.push(solution[x][y]);
      }
   }

   for (var x = 0; x < constants.BOARD_SIZE; x ++) {
      for (var y = 0; y < constants.BOARD_SIZE; y ++) {
         var ndx = Math.floor(Math.random() * pieces.length);
         shuffled[x][y] = pieces.splice(ndx, 1)[0];
      }
   }

   draw();

   solved = false;
   startTime = new Date().getTime();
   endTime = null;
}

function draw() {
   // Clear
   context.fillStyle = "#000"//"#225";
   context.fillRect(0, 0, canvas.width, canvas.height);
   
   // Board
   for (var x = 0; x < constants.BOARD_SIZE; x ++) {
      for (var y = 0; y < constants.BOARD_SIZE; y ++) {
         if (board[x][y] != null) {
            board[x][y].draw(x * constants.TILE_SIZE, y * constants.TILE_SIZE);
         }
         else {
            context.strokeStyle = "#fff";
            context.strokeRect(x * constants.TILE_SIZE + 0.5, y * constants.TILE_SIZE + 0.5, constants.TILE_SIZE - 1, constants.TILE_SIZE - 1);
         }
      }
   }
   
   // Shuffled
   for (var x = 0; x < constants.BOARD_SIZE; x ++) {
      for (var y = 0; y < constants.BOARD_SIZE; y ++) {
         if (shuffled[x][y] != null) {
            shuffled[x][y].draw(x * constants.TILE_SIZE, shuffledY + y * constants.TILE_SIZE);
         }
         else {
            context.strokeStyle = "#fff";
            context.strokeRect(x * constants.TILE_SIZE + 0.5, shuffledY + y * constants.TILE_SIZE + 0.5, constants.TILE_SIZE - 1, constants.TILE_SIZE - 1);
         }
      }
   }

   // Picked up
   if (pickedUp != null) {
      pickedUp.draw(mousex + mousexOff, mousey + mouseyOff);
   }

   // "Solved" text
   if (solvedIt()) {
      context.textBaseline = "middle";
      context.textAlign = "center";
      context.strokeStyle = "#000";

      str = "Solved!"
      context.fillStyle = "#aaf";
      context.font = "bold 25px sans-serif";
      context.fillText(str, constants.BOARD_SIZE * constants.TILE_SIZE / 2, shuffledY - constants.TILE_SIZE * (3/5));

      endTime = new Date().getTime();
      var total = endTime - startTime;
      var min = Math.floor(total / (60 * 1000));
      var sec = Math.floor(total / 1000 - min * 60);
      if (sec < 10)
         sec = "0" + sec;

      str = "Took you " + min + ":" + sec;
      context.fillStyle = "#fff";
      context.font = "15px sans-serif";
      context.fillText(str, constants.BOARD_SIZE * constants.TILE_SIZE / 2, shuffledY - constants.TILE_SIZE * (1/5));
   }
}

function solvedIt() {
   for (var x = 0; x < constants.BOARD_SIZE; x ++) {
      for (var y = 0; y < constants.BOARD_SIZE; y ++) {
         if (board[x][y] == null)
            return false;

         if (x < constants.BOARD_SIZE - 1) {
            if (board[x+1][y] == null || board[x][y].right != board[x+1][y].left)
               return false;
         }

         if (y < constants.BOARD_SIZE - 1) {
            if (board[x][y+1] == null || board[x][y].bottom != board[x][y+1].top)
               return false;
         }
      }
   }

   return true;
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

   // Update colors when constants change
   colors = new Array(constants.NUM_COLORS);
   for (var i = 0; i < constants.NUM_COLORS; i ++) {
      colors[i] = constants["COLOR_" + i];
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

   // Touch
   canvas.ontouchstart = mouseDown;
   canvas.ontouchend = mouseUp;
   canvas.ontouchmove = mouseMoved;

   // Prevent iPhone scrolling
   document.body.addEventListener('touchmove', function(event) { event.preventDefault(); }, false);

   // Hide iPhone Safari title bar (gives us a *little* more screen real estate to work with)
   window.scrollTo(0, 1);

   getConstantsFromDOM();
   init();
}
