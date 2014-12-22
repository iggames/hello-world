//
// Input
//
var mousex = 0, mousey = 0, mouseIsDown = false;
function mouseDown(e) {
   mouseIsDown = true;
}
function mouseUp(e) {
   mouseIsDown = false;
}
function mouseMoved(e) {
   mousex = e.pageX;
   mousey = e.pageY;
}

var leftKey = 65 /*A*/, upKey = 87 /*W*/, rightKey = 68 /*D*/, downKey = 83 /*S*/, spaceKey = 32;
var isLeft = 0, isUp = 0, isRight = 0, isDown = 0; 
function keyDown(e) {
   switch (e.keyCode) {
      case upKey:    isUp = true;      break;
      case downKey:  isDown = true;    break;
      case leftKey:  isLeft = true;    break;
      case rightKey: isRight = true;   break;
   }
}
function keyUp(e) {
   switch (e.keyCode) {
      case upKey:    isUp = false;     break;
      case downKey:  isDown = false;   break;
      case leftKey:  isLeft = false;   break;
      case rightKey: isRight = false;  break;
   }
}

//
// Entities
//
function Line(x1, y1, x2, y2) {
   // To simply collision detection, x1 <= x2 and y1 <= y2
   this.x1 = Math.min(x1, x2);
   this.y1 = Math.min(y1, y2);
   this.x2 = Math.max(x1, x2);
   this.y2 = Math.max(y1, y2);

   this.dx = this.x2 - this.x1;
   this.dy = this.y2 - this.y1;
   this.len = Math.sqrt(this.dx * this.dx + this.dy * this.dy);

   this.normX = this.dy / this.len;
   this.normY = -this.dx / this.len;

   this.entityOverlap = function(entity) {
      // Find distance from infinite line
      var fromEdge = (this.x1 - entity.x) * this.normX + (this.y1 - entity.y) * this.normY;
      var hitX = entity.x + this.normX * fromEdge;
      var hitY = entity.y + this.normY * fromEdge;

      // The line is infinite, but our segment is not; if "hit" point is outside our segment, just return 0
      if (hitX < this.x1 || hitX > this.x2) {
         return 0;
      }
      else
         return entity.size - Math.abs(fromEdge);
   }
}

function distBetweenEntities(a, b) {
   var x = a.x - b.x;
   var y = a.y - b.y;

   return Math.sqrt(x*x + y*y);
}

function entitiesAreColliding(a, b) {
   return distBetweenEntities(a, b) < a.size + b.size;
}

function worstEntityOverlapForPath(entity, path) {
   var worstDist = 0;
   
   for (var i = 0; i < enemies.length; i ++) {
      if (entity != enemies[i]) {
         worstDist = Math.max(path.entityOverlap(enemies[i]), worstDist);
      }
   }
   
   return worstDist;
}

function moveEntity(entity, dt) {
   // Deal with the 0-355 divide
   entity.moveAng %= Math.PI * 2;
   entity.goalAng %= Math.PI * 2;
   if (entity.goalAng - entity.moveAng > Math.PI)
      entity.goalAng -= Math.PI * 2;
   if (entity.moveAng - entity.goalAng > Math.PI)
      entity.goalAng += Math.PI * 2;
   

   // Rotate toward goal angle
   if (entity.moveAng < entity.goalAng)
      entity.moveAng = Math.min(entity.goalAng, entity.moveAng + entity.turn * dt);
   if (entity.moveAng > entity.goalAng)
      entity.moveAng = Math.max(entity.goalAng, entity.moveAng - entity.turn * dt);

   // Move forward
   entity.x += Math.cos(entity.moveAng) * entity.speed * dt;
   entity.y += Math.sin(entity.moveAng) * entity.speed * dt;
}

var player;
var RIGHT = 0, LEFT = Math.PI, DOWN = Math.PI / 2, UP = Math.PI * 3/2, DIAG = Math.PI / 4;
function Player() {
   this.isAlive = false;
   this.size = constants.PLAYER_SIZE;
   this.turn = constants.PLAYER_TURN;
   this.speed = constants.PLAYER_SPEED;

   this.spawn = function(x, y) {
      this.x = x;
      this.y = y;
      this.goalAng = 0;
      this.moveAng = this.goalAng;
      this.aimAng = 0;
      this.isAlive = true;
   }

   this.update = function(dt) {
      // Aim
      this.aimAng = Math.atan2(mousey - this.y, mousex - this.x);

      // Move
      if (isUp) {
         this.goalAng = UP;
         if (isLeft)       this.goalAng -= DIAG;
         else if (isRight) this.goalAng += DIAG;
      }
      else if (isDown) {
         this.goalAng = DOWN;
         if (isLeft)       this.goalAng += DIAG;
         else if (isRight) this.goalAng -= DIAG;
      }
      else if (isLeft)     this.goalAng = LEFT;
      else if (isRight)    this.goalAng = RIGHT;

      if (isUp || isDown || isLeft || isRight) {
         moveEntity(this, dt);
      }
   }

   this.draw = function() {
      if (this.isAlive) {
         context.save(); {
            context.translate(this.x, this.y);
            context.rotate(this.moveAng);

            // Body
            context.fillStyle = constants.PLAYER_COLOR;
            context.fillRect(-this.size, -this.size, this.size*2, this.size*2);
            context.strokeRect(-this.size, -this.size, this.size*2, this.size*2);

            // Treads
            var treadSize = constants.PLAYER_TREAD_SIZE;
            context.fillStyle = constants.PLAYER_TREAD_COLOR;
            context.fillRect(-this.size - treadSize, -this.size - treadSize, this.size*2 + treadSize*2, treadSize);
            context.strokeRect(-this.size - treadSize, -this.size - treadSize, this.size*2 + treadSize*2, treadSize);
            context.fillRect(-this.size - treadSize, this.size, this.size*2 + treadSize*2, treadSize);
            context.strokeRect(-this.size - treadSize, this.size, this.size*2 + treadSize*2, treadSize);
         }
         context.restore();
      }
   }
}

var enemies = new Array();
function Enemy() {
   this.isAlive = false;
   this.size = constants.ENEMY_SIZE;
   this.turn = constants.ENEMY_TURN;
   this.speed = constants.ENEMY_SPEED;

   this.spawn = function(x, y) {
      this.x = x;
      this.y = y;
      this.goalAng = 0;
      this.moveAng = this.goalAng;
      this.isAlive = true;
   }

   this.update = function(dt) {
      // Aim toward player
      this.goalAng = Math.atan2(player.y - this.y, player.x - this.x);
      
      // TODO: Make optimal move (minimize worst overlap)
      var path = new Line(this.x, this.y, player.x, player.y);
      if (worstEntityOverlapForPath(this, path) > 0) {
         this.goalAng += this.turn * dt;
      }
      
      moveEntity(this, dt);

      // TODO: Avoid collision with other nearby enemies
      var hit = false;
      for (var i = 0; i < enemies.length; i ++) {
         if (this != enemies[i] && entitiesAreColliding(this, enemies[i]))
            hit = true;
      }

      // If we would have hit someone, back off and stop to let them pass
      if (hit) {
         moveEntity(this, -dt);
      }
   }

   this.draw = function() {
      if (this.isAlive) {
         context.save(); {
            context.translate(this.x, this.y);
            context.rotate(this.moveAng);
            context.fillStyle = constants.ENEMY_COLOR;
            context.strokeStyle = "#000000";

            context.beginPath(); {
               context.arc(0, 0, this.size, 0, Math.PI * 2, false);
               context.fill();
               context.stroke();
            }
            context.closePath();
         }
         context.restore();

         // DEBUG: pathing
         var path = new Line(this.x, this.y, player.x, player.y);
         var pathHit = worstEntityOverlapForPath(this, path) > 0;

         context.strokeStyle = pathHit ? "#ff0000" : "#00ff00";
         context.beginPath(); {
            context.moveTo(this.x, this.y);
            context.lineTo(player.x, player.y);
            context.stroke();
         }
         context.closePath();
      }
   }
}

//
// World
//
function init() {
   player = new Player();
   player.spawn(300, 100);

   for (var i = 0; i < 4; i ++) {
      var enemy = new Enemy();
      enemy.spawn(50 + 100 * i, 40 + 150 * i);
      enemies.push(enemy);
   }
}

var lastTime = new Date().getTime(), now;
var scrollX = 0, scrollY = 0;
function update() {
   now = new Date().getTime();
   var dt = now - lastTime;

   // Clear
   context.fillStyle = "#fff";
   context.fillRect(0, 0, canvas.width, canvas.height);

   // Update
   player.update(dt);
   for (var i = 0; i < enemies.length; i ++) {
      enemies[i].update(dt);
   }

   // Draw
   context.save(); {
      context.translate(scrollX, scrollY);
      player.draw();
      for (var i = 0; i < enemies.length; i ++) {
         enemies[i].draw();
      }
   }
   context.restore();

   lastTime = now;
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
