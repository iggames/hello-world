//
// Input
//
var mousex = 0, mousey = 0, mouseIsDown = false;

function mouseDown(e) {
   if (!mouseIsDown) {
      rope.spawn(player);
   }

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
      case upKey:    isUp = true;   break;
      case downKey:  isDown = true; break;

      // Jump
      case spaceKey:
         if (rope.isAlive)
            rope.isAlive = rope.isAttached = false;
         else
            player.dy -= JUMP;
         break;
   }
}
function keyUp(e) {
   switch (e.keyCode) {
      case upKey:    isUp = false;   break;
      case downKey:  isDown = false; break;
   }
}

//
// Entities
//
var player, rope;

var JUMP = 0.5;
function Player() {
   this.isAlive = false;
   this.size = 10;

   this.spawn = function(x, y) {
      this.x = x;
      this.y = y;
      this.dx = this.dy = 0;
      this.ang = 0;
      this.isAlive = true;
   }

   this.update = function(dt) {
      this.ang = Math.atan2(mousey - this.y, mousex - this.x);

      if (!rope.isAlive || !rope.isAttached) {       // this is handled by rope, otherwise
         applyPhysics(this, dt);
         doWallCollision(this);
      }
   }

   this.draw = function() {
      context.save(); {
         context.translate(this.x, this.y);

         context.fillStyle = "#000";
         context.fillRect(-this.size, -this.size, this.size*2, this.size*2);
      }
      context.restore();
   }
}

// TODO: Vector2D class?


function RopePoint(x, y, dx, dy) {
   this.x = x;
   this.y = y;
   this.dx = dx;
   this.dy = dy;
   this.size = 4;
}

var ROPE_POINTS = 10;
var ROPE_MIN = 20, ROPE_MAX = 500;
var CHANGE_LEN_SPEED = 0.1;
function Rope() {
   this.isAlive = this.isAttached = false;

   // For now, spawn with attached to ceiling already
   // Eventually, we'll come up with a good way to shoot it
   this.spawn = function(player) {
      this.owner = player;
      this.isAlive = true;
      this.isAttached = false;

      // Shoot first point out of rope gun
      this.points = new Array();
      this.points.push(
            new RopePoint(this.owner.x, this.owner.y,
               player.dx + Math.cos(player.ang) * constants.ROPE_SPEED,
               player.dy + Math.sin(player.ang) * constants.ROPE_SPEED)
            );

      // TODO: Start rope fully formed, in the direction it's shooting
      // (for now, it'll trail behind the player)
      // Add rest of points
      //var lx = this.owner.x - this.x;
      //var ly = this.owner.y - this.y;
      //var len = Math.sqrt(lx * lx + ly * ly);
      //this.partLen = len / ROPE_POINTS;
      this.partLen = 20;

      for (var i = 1; i <= ROPE_POINTS; i ++) {
         this.points.push(
               new RopePoint(this.points[0].x - Math.cos(player.ang) * this.partLen * i,
                  this.points[0].y - Math.sin(player.ang) * this.partLen * i,
                  this.points[0].dx,
                  this.points[0].dy)
               );
      }
   }

   this.update = function(dt) {
      if (!this.isAttached) {
         applyPhysics(this.points[0], dt);

         if (doWallCollision(this.points[0])) {
            this.isAttached = true;
         }
      }
      else {
         this.points[0].dx = this.points[0].dy = 0;

         // Rope is made up of a bunch of springs
         // based on http://nehe.gamedev.net/data/lessons/lesson.asp?lesson=40
         var prev = this.points[0];
         var now;

         // Find the force on each rope point
         for (var i = 1; i < this.points.length; i ++) {
            now = this.points[i];
            var lx = now.x - prev.x;
            var ly = now.y - prev.y;
            var len = Math.sqrt(lx * lx + ly * ly);

            var forceX, forceY;
            if (len != 0) {
               var springyness = (len - this.partLen) * constants.ROPE_SPRING;
               forceX = -(lx / len) * springyness;
               forceY = -(ly / len) * springyness;

               // Friction
               forceX += -(now.dx - prev.dx) * constants.ROPE_FRICTION;
               forceY += -(now.dy - prev.dy) * constants.ROPE_FRICTION;

               prev.dx -= forceX;
               prev.dy -= forceY;
               now.dx += forceX;
               now.dy += forceY;
            }

            prev = now;
         }

         // Put player at end of rope
         this.owner.x = now.x;
         this.owner.y = now.y;
         this.owner.dx = now.dx;
         this.owner.dy = now.dy;
      }

      // Apply the force to each rope point
      for (var i = 1; i < this.points.length; i ++) {
         applyPhysics(this.points[i], dt);
         doWallCollision(this.points[i], dt);
      }
   }

   this.draw = function() {
      // Rope
      context.beginPath(); {
         context.strokeStyle = "#f92";
         context.moveTo(this.points[0].x, this.points[0].y);
         for (var i = 1; i < this.points.length; i ++) {
            var p = this.points[i];
            context.lineTo(p.x, p.y);
         }
         context.stroke();
      }
      context.closePath();

      // Hook
      context.fillStyle = "#aaa";
      var p = this.points[0];
      context.fillRect(p.x - p.size, p.y - p.size, p.size*2, p.size*2);

      // DEBUG
      context.fillStyle = "#f00";
      for (var i = 1; i < this.points.length; i ++) {
         p = this.points[i];
         context.fillRect(p.x - p.size, p.y - p.size, p.size*2, p.size*2);
      }
   }
}

function drawEntity(entity) {
   if (entity.isAlive) {
      //context.save(); {
         //context.translate(entity.x, entity.y);
         // TODO: Scroll here
         entity.draw();
      //}
      //context.restore();
   }
}

//
// Physics
//
function applyPhysics(entity, dt) {
   entity.dy += constants.GRAVITY * dt;

   entity.x += entity.dx * dt;
   entity.y += entity.dy * dt;
}

function doWallCollision(entity) {
   var hit = false;

   // TEMP: Use walls of canvas
   if (entity.x < entity.size) {
      entity.x = entity.size;
      entity.dx = Math.max(0, entity.dx);
      hit =  true;
   }
   if (entity.x > canvas.width - entity.size) {
      entity.x = canvas.width - entity.size;
      entity.dx = Math.min(0, entity.dx);
      hit =  true;
   }
   if (entity.y < entity.size) {
      entity.y = entity.size;
      entity.dy = Math.max(0, entity.dy);
      hit =  true;
   }
   if (entity.y > canvas.height - entity.size) {
      entity.y = canvas.height - entity.size;
      entity.dy = Math.min(0, entity.dy);
      hit =  true;
   }

   return hit;
}


//
// World
//
function init() {
   player = new Player();
   player.spawn(300, 100);
   rope = new Rope();
}

var lastTime = new Date().getTime(), now;
function update() {
   now = new Date().getTime();
   var dt = now - lastTime;

   // Clear
   context.fillStyle = "#fff";
   context.fillRect(0, 0, canvas.width, canvas.height);

   // Update
   player.update(dt);
   if (rope.isAlive)
      rope.update(dt);  // rope gets final say (in case we're attached)

   // Draw
   drawEntity(rope);
   drawEntity(player);

   lastTime = now;
}

//
// Init
//
var constants = new Array();     // constants from game_vars object

function getConstantsFromDOM() {
   var form = document.getElementById("game_vars");

   for (var i = 0; i < form.elements.length - 1 /* don't include update button*/; i++) {
      var name = form.elements[i].name;
      var value = form.elements[i].value;
      constants[name] = value;
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
