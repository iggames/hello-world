//
// LUNAR RESCUE
// (c) 2011 Jeremy Leland
//

var canvas;
var context;
var bgImage;
var player;
var debris;
var home;
var pads;
var NUM_PADS = 1;    // this will be increased to 2 when we spawn the world (1 home + 1 pad)
var PER_PAD = 2;
var mapWidth;
var ground;
var scrollX = 0;
var drawFPS = false;
var toRescue = 0;
var crashes = 0;
var startTime, endTime;
var splashScreen = true;

//
// User Input
//
var leftKey = 37, upKey = 38, rightKey = 39, downKey = 40, spaceKey = 32;	// in FF, at least...
var isLeft = 0, isUp = 0, isRight = 0, isDown = 0; 
function keyDown(e) {
   // Only show splash screen in the beginning (we'll see first level in BG, but won't be counting time yet)
   if (splashScreen) {
      startTime = new Date().getTime();
      splashScreen = false;
   }
   if (!player.isAlive && !player.isSpawning && !isLeft && !isUp && !isRight && !isDown)  // only spawn if all keys are up (so they can see message)
      spawnPlayer();
   else if (toRescue == 0)
      spawnWorld();
   else {
      switch (e.keyCode) {
         case leftKey:  isLeft = true;    break;
         case upKey:    isUp = true;      break;
         case rightKey: isRight = true;   break;
         case downKey:  isDown = true;    break;
      }
   }
}
function keyUp(e) {
   switch (e.keyCode) {
      case leftKey:  isLeft = false;   break;
      case upKey:    isUp = false;     break;
      case rightKey: isRight = false;  break;
      case downKey:  isDown = false;   break;
   }
}

//
// Update
//
function updateEntity(entity, dt) {
  entity.dy += GRAVITY * dt;
  entity.x += entity.dx * dt;
  entity.y += entity.dy * dt;

  entity.update(dt);
  
  var collision = getGroundCollision(entity);
  if (collision.fromEdge > -entity.size)
    entity.hitGround(collision);

  for (var i = 0; i < pads.length; i ++) {
     collision = getLandingPadCollision(entity, pads[i]);
     if (collision.fromEdge > -entity.size)
        entity.hitLandingPad(collision, pads[i], dt);
  }
}

//
// Collision detection
//
function Collision(entity, x1, y1, x2, y2, norm) {
   // TODO: Explain negative/positive (negative is outside, positive inside? or the other way around...)

   // Find distance from infinite line
   this.fromEdge = (x1 - entity.x) * norm[0] + (y1 - entity.y) * norm[1];
   this.hitX = entity.x + norm[0] * this.fromEdge;
   this.hitY = entity.y + norm[1] * this.fromEdge;

   // The line is infinite, but our segment is not; if "hit" point is outside
   // our segment, use distance from ends of line
   if (this.hitX < x1) {
      this.hitX = x1;
      this.hitY = y1;

      var x = entity.x - x1;
      var y = entity.y - y1;
      this.fromEdge = -Math.sqrt(x*x + y*y);
   }
   else if (this.hitX > x2) {
      this.hitX = x2;
      this.hitY = y2;

      var x = entity.x - x2;
      var y = entity.y - y2;
      this.fromEdge = -Math.sqrt(x*x + y*y);
   }
}
function getGroundCollision(entity) {
   // Find ground points
   var ndx = Math.floor(entity.x / GROUND_WIDTH);
   var x1 = ndx * GROUND_WIDTH;
   var y1 = ground.heights[ndx];
   var x2 = x1 + GROUND_WIDTH;
   var y2 = ground.heights[ndx+1];

   return new Collision(entity, x1, y1, x2, y2, ground.normal(entity));
}

function getLandingPadCollision(entity, pad) {
   var x1 = pad.x, x2 = pad.x + pad.w;
   var y1 = y2 = pad.y;

   return new Collision(entity, x1, y1, x2, y2, [0, -1]);
}


//
// Debris
//
var DEBRIS_SIZE = 5;
var DEBRIS_SPIN = 0.02;
var DEBRIS_SPEED = 0.21;
function Debris() {
  this.spawn = function(x, y, dx, dy, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.color = color;
    this.ang = Math.random() * Math.PI*2;
    this.size = Math.random() * DEBRIS_SIZE;
    this.spin = Math.random() * DEBRIS_SPIN * 2 - DEBRIS_SPIN;
    this.isAlive = true;
  }
  
  //
  // Update
  //
  this.update = function(dt) {
    this.ang += this.spin * dt;
  }
  this.hitGround = function(collision) {
     var groundNorm = ground.normal(this);
     this.bounce(collision, groundNorm[0], groundNorm[1]);
  }
  this.hitLandingPad = function(collision, pad, dt) {
    this.bounce(collision, 0, -1);
  }
  this.bounce = function(collision, normX, normY) {
    this.x = collision.hitX + normX * this.size;
    this.y = collision.hitY + normY * this.size;

    // Bounce
    var damping = 0.7;
    var vDotN = this.dx * normX + this.dy * normY;
    this.dx = this.dx - 2 * vDotN * normX * damping;
    this.dy = this.dy - 2 * vDotN * normY * damping;

    // Friction
    var friction = 0.1;
    var vDotF = this.dx * normY + this.dy * normX;
    this.dx -= vDotF * normY * friction;
    this.dy -= vDotF * normX * friction;

    this.spin *= damping;

    // TODO: Make this NOT_MOVING overall, not in each direction
    var NOT_MOVING = 0.005;
    if (Math.abs(this.dx) <= NOT_MOVING && Math.abs(this.dy) <= NOT_MOVING)
       this.isAlive = false;
  }
  
  //
  // Drawing
  //
  this.draw = function() {
    var x = this.x - scrollX;

    // Bail out early if we'll be off screen
    if (x - SIZE > canvas.width || this.y - SIZE > canvas.height)
      return;

    var xTop = Math.cos(this.ang) * this.size, yTop = Math.sin(this.ang) * this.size;
    var xRight = Math.cos(this.ang + Math.PI/2) * this.size, yRight = Math.sin(this.ang + Math.PI/2) * this.size;
    var xLeft = Math.cos(this.ang - Math.PI/2) * this.size, yLeft = Math.sin(this.ang - Math.PI/2) * this.size;
    
    context.beginPath();
    context.moveTo(x + xTop, this.y + yTop);
    context.lineTo(x + xRight, this.y + yRight);
    context.lineTo(x + xLeft, this.y + yLeft);
    context.lineTo(x + xTop, this.y + yTop);
    context.strokeStyle = SHIP_OUTLINE_COLOR;
    context.fillStyle = this.color;
    context.fill();
    context.stroke();
    context.closePath();
  }
}

//
// Player
//
var ROT_SPEED;    // from DOM
var MOVE_SPEED;   // from DOM
var SPAWN_SPEED = 0.04;
var CRASH_SPEED;  // from DOM
var SIZE = 24.0;
var SHIP_OUTLINE_COLOR = "#000";
var SHIP_BODY_COLOR = "#800";
var SHIP_FINS_COLOR = "#880";
var SHIP_VIEW_COLOR = "#888";
var SHIP_TRAIL_COLOR = "rgba(255, 200, 0, 0.7)";
var MAX_FUEL = 100, FUEL_USE /*from DOM*/, REFUEL_SPEED = 0.1;
var MAX_TRAIL_LEN = 1.5;
var TRAIL_SPEED = 0.005;
var NUM_DEBRIS = 60;
var UP_ANG = -Math.PI/2;
function Player() {
  this.spawn = function(homeBase) {
    this.size = SIZE;

    this.isAlive = false;
    this.isSpawning = true;
    this.homeBase = homeBase;
    this.x = this.homeBase.x + this.homeBase.w / 2;
    //scrollX = this.x + canvas.width/3;
    this.y = this.homeBase.y + this.size;      // start below pad, so we can rise out of surface

    this.dx = 0;
    this.dy = 0;
    this.ang = UP_ANG;

    this.fuel = MAX_FUEL;
    this.trailLen = 0;
  }
  
  //
  // Update
  //
  this.update = function(dt) {
     // Spawn by rising up from "within" the landing pad
     if (this.isSpawning && !splashScreen) {
        this.y = Math.max(this.homeBase.y - this.size, this.y - SPAWN_SPEED * dt);
        if (this.y == this.homeBase.y - this.size) {
           this.isSpawning = false;
           this.isAlive = true;
        }
     }
     else {
        // Turning
        if (isLeft)    this.ang -= ROT_SPEED * dt;
        if (isRight)   this.ang += ROT_SPEED * dt;

        // Engines
        if (isUp && this.fuel > 0 && toRescue > 0) {
           this.dx += Math.cos(this.ang) * MOVE_SPEED * dt;
           this.dy += Math.sin(this.ang) * MOVE_SPEED * dt;

           // make the engine trail length pulse (so it's not just a static orange triangle)
           this.trailLen = Math.min(MAX_TRAIL_LEN - 0.1 + 0.1*Math.cos(now/30), this.trailLen + TRAIL_SPEED * dt + 0.05 /*so its always a little visible*/);
           this.fuel = Math.max(0, this.fuel - FUEL_USE * dt);
        }
        else {
           this.trailLen = Math.max(0, this.trailLen - TRAIL_SPEED * dt);
        }
        if (isDown) {
           // brakes?
        }
     }
  }
  this.hitGround = function(collision) {
     if (!this.isSpawning) {
        this.explode();
        showGameOver();
     }
  }
  this.hitLandingPad = function(collision, pad, dt) {
     if (!this.isSpawning) {     // ignore collision if we're spawning
        // Landing
        if (this.dy < CRASH_SPEED && Math.abs(this.dx) < CRASH_SPEED &&           // need to go slow
              Math.abs(this.ang - UP_ANG) < 0.5) {    // need to aim up

           var damping = 0.6;
           this.dx *= damping;
           this.dy = Math.min(0, this.dy);   // let us fly up and away (negative dy)

           this.x = collision.hitX;
           this.y = collision.hitY - this.size;
           this.ang = UP_ANG;

           pad.landedOn();

           this.fuel = Math.min(MAX_FUEL, this.fuel + REFUEL_SPEED * dt);
        }
        // Crashing
        else {
           this.explode();
        }
     }
  }

  //
  // Drawing
  //
  this.draw = function() {
    var x = this.x - scrollX;

    // Bail out early if we'll be off screen
    if (x - SIZE > canvas.width || this.y - SIZE > canvas.height)
      return;

    var ca = Math.cos(this.ang), sa = Math.sin(this.ang)
    var cos_size = ca * SIZE;
    var sin_size = sa * SIZE;
    var cas = Math.cos(this.ang - Math.PI/2), sas = Math.sin(this.ang - Math.PI/2)
    var cos_size_side = cas * SIZE/2;
    var sin_size_side = sas * SIZE/2;

    // Trail (from engine)
    context.strokeStyle = SHIP_TRAIL_COLOR;
    context.fillStyle = SHIP_TRAIL_COLOR;
    context.beginPath();
    context.lineTo(x - cos_size * this.trailLen, this.y - sin_size * this.trailLen);
    context.lineTo(x - cos_size_side, this.y - sin_size_side);
    context.lineTo(x + cos_size_side, this.y + sin_size_side);
    context.stroke();
    context.fill();
    context.closePath();

    context.strokeStyle = SHIP_OUTLINE_COLOR;

    // Fins
    context.beginPath();
    context.moveTo(x, this.y);
    context.arc(x - cos_size*(1/2), this.y - sin_size*(1/2), SIZE*(3/4), 
	  this.ang - Math.PI*(2/3), this.ang + Math.PI*(2/3), false);
    context.lineTo(x, this.y);
    context.fillStyle = SHIP_FINS_COLOR;
    context.fill();
    context.stroke();
    context.closePath();

    // Body (covers fins)
    context.beginPath();
    context.arc(x - sin_size/2, this.y + cos_size/2, SIZE, 
	  this.ang - Math.PI/6, this.ang - Math.PI*(4/6), true);
    context.arc(x + sin_size/2, this.y - cos_size/2, SIZE, 
	  this.ang + Math.PI*(4/6), this.ang + Math.PI/6, true);
    context.fillStyle = SHIP_BODY_COLOR;
    context.fill();
    context.stroke();
    context.closePath();

    // Viewport
    context.beginPath();
    context.arc(x + cos_size*(1/4), this.y + sin_size*(1/4), SIZE/4, 0, Math.PI*2, true);
    context.fillStyle = SHIP_VIEW_COLOR;
    context.fill();
    context.stroke();
    context.closePath();
  }
  
  //
  // Explode in debris
  //
  // Use lots of Math.random to make it look more chaotic
  this.explode = function() {
    for (var i = 0; i < NUM_DEBRIS; i ++) {
      var dirAng = Math.PI * 2 / NUM_DEBRIS * i;
      var xDir = Math.cos(dirAng + Math.random()), yDir = Math.sin(dirAng + Math.random());
      var speed = Math.random() * DEBRIS_SPEED;
      
      var colorVal = Math.random();
      var color = colorVal < 0.6 ? (colorVal < 0.1 ? SHIP_VIEW_COLOR : SHIP_BODY_COLOR) : SHIP_FINS_COLOR;

      var piece = new Debris();
      piece.spawn(this.x + xDir * Math.random()*SIZE, this.y + yDir * Math.random()*SIZE, 
				  this.dx + xDir * speed, this.dy + yDir * speed, color);
      debris.push(piece);
    }
    
    this.isAlive = false;
    crashes ++;
  }
}

//
// Landing pad
//
var PAD_HEIGHT = 12;
var PAD_MIN_STRIPES = 4;
var PAD_MAX_STRIPES = 5;
var PAD_MIN_Y = 300;
var LIGHT_SIZE = 5;
function LandingPad(numPeople) {
   this.numPeople = numPeople;

   this.spawn = function(x, y, stripes) {
      this.x = x;
      this.y = y;
      this.stripes = stripes;
      this.w = stripes * PAD_HEIGHT * 2 + 2;
      this.h = PAD_HEIGHT + 2;

      // Each landing pad has some people to be rescued
      this.people = new Array();
      for (var p = 0; p < numPeople; p ++) {
         var man = new SpaceMan();
         man.spawn(this.x + LIGHT_SIZE*3 + MAN_SIZE * p, this.y /*padY*/);
         this.people.push(man);
      }
      this.rescued = this.numPeople == 0;    // home pad starts as "true"; everything else starts "false"
   }

  this.landedOn = function() {
     if (toRescue > 0) {
        for (var i = 0; i < this.people.length; i ++) {
           this.people[i].rescue();
        }
        this.rescued = true;

        endTime = now;
     }
  }

  this.update = function(dt) {
     for (var i = 0; i < this.people.length; i ++) {
        this.people[i].update(dt);
     }
  }

  this.draw = function() {
     for (var i = 0; i < this.people.length; i ++) {
        this.people[i].draw();
     }

    context.strokeStyle = "#000";

    var x = this.x - scrollX;

    // lights
    var lightVal = Math.abs(Math.floor(Math.cos(now/500)*255));   // strobe effect
    if (!this.rescued)
       context.fillStyle = "rgb(" + lightVal + ", 0, 0)";      // red if there are people
    else
       context.fillStyle = "rgb(0, " + lightVal + ", 0)";      // green if they've been rescued

    context.beginPath();
    context.arc(x + LIGHT_SIZE, this.y, LIGHT_SIZE, 0, Math.PI, true);
    context.fill();
    context.stroke();
    context.closePath();
    context.beginPath();
    context.arc(x + this.w - LIGHT_SIZE, this.y, LIGHT_SIZE, 0, Math.PI, true);
    context.fill();
    context.stroke();
    context.closePath();

    // black background
    context.fillStyle = "#111";
    context.beginPath();
    context.moveTo(x, this.y);
    context.lineTo(x + this.w, this.y);
    context.lineTo(x + this.w, this.y + this.h);
    context.lineTo(x, this.y + this.h);
    context.fill();
    context.stroke();
    context.closePath();

    // yellow stripes
    context.fillStyle = "#ff1";
    var maxX = x + this.w;
    for (var i = 0; i < this.stripes; i ++) {
      context.beginPath();
      context.moveTo(x + PAD_HEIGHT*i*2, this.y + this.h);
      context.lineTo(Math.min(maxX, x + PAD_HEIGHT*(i*2+1)), this.y);
      context.lineTo(Math.min(maxX, x + PAD_HEIGHT*(i*2+2)), this.y);
      context.lineTo(Math.min(maxX, x + PAD_HEIGHT*(i*2+1)), this.y + this.h);
      context.fill();
      context.stroke();
      context.closePath();
    }
  }
}

//
// Ground
//
var GROUND_WIDTH = 50;
function Ground() {
   this.spawn = function() {
      this.heights = new Array();
      for (var i = 0; i < mapWidth / GROUND_WIDTH; i ++) {
         this.heights.push(canvas.height - Math.random() * 200);
      }
   }
   this.height = function(entityX) {
      var ndx = Math.floor(entityX / GROUND_WIDTH);
      var h1 = this.heights[ndx];
      var h2 = this.heights[ndx+1];
      var perc = (entityX - ndx * GROUND_WIDTH) / GROUND_WIDTH;

      return h1 * (1 - perc) + h2 * perc;
   }
   this.normal = function(entity) {
      // TODO: use -size and +size to find min and max ndx?
      var ndx = Math.floor(entity.x / GROUND_WIDTH);
      var h1 = this.heights[ndx];
      var h2 = this.heights[ndx+1];

      var x = GROUND_WIDTH;
      var y = h2 - h1;
      var len = Math.sqrt(x * x + y * y);

      return [y/len, -x/len];
   }
   this.draw = function() {
      context.fillStyle = "#888";
      context.strokeStyle = "000";
      context.beginPath();
      context.moveTo(0, canvas.height);
      for (var i = 0; i < this.heights.length; i ++) {
         context.lineTo(i * GROUND_WIDTH - scrollX, this.heights[i]);
      }
      context.lineTo(this.heights.length * GROUND_WIDTH - scrollX, canvas.height);
      context.lineTo(0, canvas.height);
      context.fill();
      context.stroke();
      context.closePath();
   }
}

//
// Spaceman
//
var MAN_SIZE = 20;
var SUIT_COLOR = "#fff";
var VISOR_COLOR = "#882";
function SpaceMan() {
   this.spawn = function(x, padY) {
      this.size = MAN_SIZE - Math.random() * 5;    // give us some smaller spacemen
      this.x = x;
      this.y = padY - this.size * (4/5);
      this.thick = 2.5;
      this.armAngVal = 0;
      this.armAng = Math.PI*(3/4);
      this.isRescued = false;
      this.rescuePerc = 0.0;

      toRescue ++;      // one more person to rescue
   }

   this.update = function(dt) {
      // By including distX, they wave more furiously when player is nearby
      // We use our own "ang val" instead of "now" so that the arm wave speed changes smoothly
      var distX = Math.abs(this.x - player.x);
      this.armAngVal += dt / (distX/1000 + 0.5);

      if (!player.isAlive) {
         this.armAng = -Math.PI/2 + Math.PI*(3/4);
      }
      else if (this.isRescued) {
         this.armAng = -Math.PI/2 + Math.PI*(1/4);
         this.rescuePerc = Math.min(2, this.rescuePerc + dt/1000);   // how far we are in the rescue animation
      }
      else {
         this.armAng = -Math.PI/2 + Math.PI/4 + Math.cos(this.armAngVal/200)*0.2;
      }
   }
   
   this.draw = function() {
      context.save(); {
         context.translate(this.x - scrollX, this.y);

         var headY = -this.size/2.5;
         var neckY = -this.size/10;
         var armc = Math.cos(this.armAng)*this.size, arms = Math.sin(this.armAng)*this.size;
         var hipY = this.size/5;
         var legAng = Math.PI/2 - Math.PI/5;
         var legc = Math.cos(legAng)*this.size, legs = Math.sin(legAng)*this.size;

         if (this.rescuePerc < 1) {
            context.fillStyle = SUIT_COLOR;
            context.strokeStyle = "#000";
            context.beginPath();

            // LEFT SIDE
            // Neck
            context.moveTo(-this.thick/2, headY);
            context.lineTo(-this.thick/2, neckY);
            // Arms
            context.lineTo(-armc, arms);
            context.lineTo(-armc, arms + this.thick);
            context.lineTo(-this.thick/2, neckY + this.thick);
            // Legs
            context.lineTo(-this.thick/2, hipY);
            context.lineTo(-legc, legs);
            context.lineTo(-legc + this.thick, legs);
            context.lineTo(0, hipY + this.thick);

            // RIGHT SIDE
            // Legs
            context.lineTo(legc - this.thick, legs);
            context.lineTo(legc, legs);
            context.lineTo(this.thick/2, hipY);
            // Arms
            context.lineTo(this.thick/2, neckY + this.thick);
            context.lineTo(armc, arms + this.thick);
            context.lineTo(armc, arms);
            // Neck
            context.lineTo(this.thick/2, neckY);
            context.lineTo(this.thick/2, headY);

            context.stroke();
            context.fill();
            context.closePath();

            // HEAD
            // Helmet
            context.beginPath();
            context.arc(0, headY - this.size/4, this.size/3, 0, Math.PI*2, true);
            context.fill();
            context.stroke();
            context.closePath();

            // Visor
            context.fillStyle = "#ca2";
            context.beginPath();
            context.fillRect(-this.size/4, headY-this.size/4 - this.size/10, 2*this.size/4, this.size/4);
            context.strokeRect(-this.size/4, headY-this.size/4 - this.size/10, 2*this.size/4, this.size/4);
            context.closePath();
         }

         // Rescue ball
         if (this.isRescued) {
            context.beginPath();

            // Phase one: ball goes solid
            if (this.rescuePerc < 1) {
               context.fillStyle = "rgba(240, 240, 255, " + this.rescuePerc + ")";
               context.arc(0, 0, this.size, 0, Math.PI*2, true);
            }
            // Phase two: ball shrinks
            else {
               context.fillStyle = "rgba(240, 240, 255, 1)";
               context.arc(0, 0, this.size * (2 - this.rescuePerc), 0, Math.PI*2, true);
            }

            context.fill();
            context.stroke();
            context.closePath();
         }
      }
      context.restore();
   }

   this.rescue = function() {
      if (!this.isRescued)
         toRescue --;         // one less person to rescue
      this.isRescued = true;
   }
}

//
// Game loop
//

var GRAVITY;   // from DOM
var lastTime = new Date().getTime(), now;
function update() {
  now = new Date().getTime();
  var dt = now - lastTime;

  // Clear
  //context.drawImage(bgImage, -scrollX * ((bgImage.width - canvas.width) / mapWidth), 0);   // TODO: paralax scrolling?
  context.drawImage(bgImage, 0, 0);   // TODO: paralax scrolling?
  for (var i = 0; i < debris.length; i ++) {
    // TODO: Draw to background
    if (!debris[i].isAlive) {
       debris.splice(i, 1);   // for now, let the GC take care of it
       i --;                  // (to counter-act the impending ++)
    }
  } 

  // Update and draw
  if (player.isAlive || player.isSpawning) {
     if (player.isAlive)
        updateEntity(player, dt);
     else
        player.update(dt);

     scrollX = Math.min(scrollX, Math.max(0, player.x - canvas.width/3));
     scrollX = Math.max(scrollX, Math.min(mapWidth - canvas.width, player.x - canvas.width * (2/3)));
     //scrollX = Math.min(Math.max(0, player.x - canvas.width/2), mapWidth - canvas.width);

     player.draw();

     if (splashScreen)
        showSplashScreen();
  }
  else
     showGameOver();

  for (var i = 0; i < debris.length; i ++) {
    if (debris[i].isAlive) {
      updateEntity(debris[i], dt);
      debris[i].draw();
    }
  }

  for (var i = 0; i < pads.length; i ++) {
     pads[i].update(dt);
     pads[i].draw();
  }
  ground.draw();

  // UI
  if (!splashScreen) {
     context.fillStyle = "#fa3";
     var fuelUIYellow = Math.floor(player.fuel * 2); // from 0 to 200
     var fuelUIAlpha = player.fuel > 35 ? 1.0 : Math.abs(Math.cos(now/(100)));      // flash fuel when low
     context.fillStyle = "rgba(255, " + fuelUIYellow + ", 0, " + fuelUIAlpha + ")";
     context.fillRect(10, 10, player.fuel * 1.5, 10);
  }
  
  if (toRescue == 0)
     showWin();
  else {       // off-screen indicators
     context.strokeStyle = "#000";
     context.fillStyle = "#fff";
     context.textBaseline = "middle";
     context.textAlign = "center";
     var offscreenHeight = 14;
     context.font = offscreenHeight + "px sans-serif";

     // Left
     var numLeft = 0;
     for (var i = 0; i < pads.length; i ++) {
        if (pads[i].x < scrollX && !pads[i].rescued)
           numLeft += PER_PAD;
     }
     if (numLeft > 0) {
        context.beginPath();
        context.moveTo(5, canvas.height/2);
        context.lineTo(20, canvas.height/2 - 5);
        context.lineTo(20, canvas.height/2 + 5);
        context.fill();
        context.stroke();
        context.closePath();
        context.fillText(numLeft, 13, canvas.height/2 + offscreenHeight + 5);
     }

     // Right
     var numRight = 0;
     for (var i = 0; i < pads.length; i ++) {
        if (pads[i].x > scrollX + canvas.width && !pads[i].rescued)
           numRight += PER_PAD;
     }
     if (numRight > 0) {
        context.beginPath();
        context.moveTo(canvas.width - 5, canvas.height/2);
        context.lineTo(canvas.width - 20, canvas.height/2 - 5);
        context.lineTo(canvas.width - 20, canvas.height/2 + 5);
        context.fill();
        context.stroke();
        context.closePath();
        context.fillText(numRight, canvas.width - 12, canvas.height/2 + offscreenHeight + 5);
     }
  }

  // FPS
  if (drawFPS) {
     context.fillStyle = "#fff";
     context.font = "12px sans-serif";
     context.textAlign = "right";
     context.textBaseline = "top";
     context.fillText(Math.floor(1000/dt), canvas.width, 0);
  }

  lastTime = now;
}
function showMessage(str) {
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.strokeStyle = "#000";
  context.fillStyle = "#aaf";
  context.font = "bold 30px sans-serif";
  context.fillText(str, canvas.width/2, canvas.height/3);
  //context.strokeText(str, canvas.width/2, canvas.height/3);
}
function showSubMessage(str) {
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.strokeStyle = "#000";
  context.fillStyle = "#ddf";
  context.font = "bold 20px sans-serif";
  context.fillText(str, canvas.width/2, canvas.height/3 + 30);
  //context.strokeText(str, canvas.width/2, canvas.height/3 + 30);
}
function showSmallMessage(str) {
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.strokeStyle = "#000";
  context.fillStyle = "#fff";
  context.font = "bold 14px sans-serif";
  context.fillText(str, canvas.width/2, canvas.height/3 + 30 + 25);
  //context.strokeText(str, canvas.width/2, canvas.height/3 + 30);
}
function showSplashScreen() {
   showMessage("Lunar Rescue");
   showSubMessage("Land gently, and watch your fuel!");
   showSmallMessage("(press any key to begin)");
}
function showGameOver() {
  showMessage("Crash!");
  showSubMessage("(press any key to try again)");
}
function showWin() {
  showMessage("Level Complete!");

  var total = endTime - startTime;
  var min = Math.floor(total / (60 * 1000));
  var sec = Math.floor(total / 1000 - min * 60);
  if (sec < 10)
     sec = "0" + sec;
  showSubMessage("It took you " + min + ":" + sec + " and " + 
        crashes + (crashes == 1 ? " crash " : " crashes ") +
        "to rescue " + ((NUM_PADS - 1)*PER_PAD) + " people.");
  showSmallMessage("(press any key for next level)");
}
function spawnPlayer() {
   player.spawn(home);
}
function spawnWorld() {
   NUM_PADS ++;   // each level should have more pads
   mapWidth = 500 * NUM_PADS;

   // Init world
   debris = new Array();
   player = new Player();
   pads = new Array();
   ground = new Ground();
   ground.spawn();

   // Pad
   for (var p = 0; p < NUM_PADS; p ++) {
      var pad;

      // Put home base in the middle
      if (p == Math.floor(NUM_PADS/2))
         home = pad = new LandingPad(0);
      else
         pad = new LandingPad(PER_PAD);

      var padStripes = PAD_MAX_STRIPES + Math.random() * (PAD_MAX_STRIPES - PAD_MIN_STRIPES);

      // distribute the pads (relatively) evenly across the map
      var mapSectionWidth = (mapWidth - padStripes * PAD_HEIGHT * 2) / NUM_PADS;
      var padX = (p + 0.2 + Math.random() * 0.6) * mapSectionWidth;

      var padY = ground.height(padX) - PAD_HEIGHT;
      pad.spawn(padX, padY, padStripes);

      // Flatten ground under pad
      var minPad = Math.floor(padX / GROUND_WIDTH);
      var maxPad = Math.ceil((padX + padStripes * PAD_HEIGHT * 2) / GROUND_WIDTH);
      for (var i = minPad; i <= maxPad; i++) {
         ground.heights[i] = pad.y + PAD_HEIGHT;
      }

      pads.push(pad);
   }

   crashes = 0;

   spawnPlayer();
   startTime = new Date().getTime();   // if we're still in splash screen, this will be updated later
}

//
// Launcher
//
function getConstantsFromDOM() {
   var form = document.getElementById("game_vars");
   MOVE_SPEED = parseFloat(form.elements["MOVE_SPEED"].value);
   ROT_SPEED = parseFloat(form.elements["ROT_SPEED"].value);
   CRASH_SPEED = parseFloat(form.elements["CRASH_SPEED"].value);
   GRAVITY = parseFloat(form.elements["GRAVITY"].value);
   FUEL_USE = parseFloat(form.elements["FUEL_USE"].value);
}

window.onload = function() {
   canvas = document.getElementById("game");
   context = canvas.getContext("2d");

   // Load resources
   bgImage = new Image();
   bgImage.src = "moon-earth.jpg";
   bgImage.onload = function() {          // TODO: wait for image to load before starting?
      context.drawImage(bgImage, 0, 0);
   }

   // Get constants from DOM
   getConstantsFromDOM();
   //document.getElementById("game_vars")

   spawnWorld();

   // Start it
   document.onkeydown = keyDown;
   document.onkeyup   = keyUp;
   setInterval(update, 10);

}
