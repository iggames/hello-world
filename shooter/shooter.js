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
// World
//
var player;
var enemies = new Array();
var bullets = new Array();
var maze = new Maze(10, 10);
var level;
var fogOfWar;
var fogOfWarContext;

function addEnemy(tileX, tileY) {
   var enemy = new Enemy();
   enemy.spawn(tileX * level.tileSize, tileY * level.tileSize);
   enemies.push(enemy);
}
function init() {
   player = new Player();
   player.spawn(300, 100);

   level = new Level();
   level.spawn(maze);

   for (var i = 0; i < constants.ENEMY_COUNT; i ++) {
      var hallX = Math.random() * (level.maze.width - 2) + 1;
      var hallY = Math.random() * (level.maze.height - 2) + 1;
      addEnemy(hallX * level.hallTiles + level.hallTiles/2, hallY * level.hallTiles + level.hallTiles/2);
   }

   fogOfWar = document.createElement('canvas');
   fogOfWar.width = level.width * level.tileSize;
   fogOfWar.height = level.height * level.tileSize;
   fogOfWarContext = fogOfWar.getContext('2d');
}

// Brightness: how much darkness is removed
// a: alpha of tinting color applied after darkness is removed
function drawPointLight(x, y, brightness, r, g, b, a, size, ctx) {
   var lightPoints = new Array();

   var angInc = Math.PI*2 / constants.PLAYER_AMB_RES;
   for (var ang = 0; ang <= Math.PI*2; ang += angInc) {
      lightPoints.push(level.firstWallCollision(x, y, ang));
   }

   ctx.beginPath(); {
      ctx.moveTo(lightPoints[0][0], lightPoints[0][1]);
      for (var i = 1; i < lightPoints.length; i ++) {
         ctx.lineTo(lightPoints[i][0], lightPoints[i][1]);
      }

      var alphaGrad = fogOfWarContext.createRadialGradient(x, y, 0, x, y, size);
      alphaGrad.addColorStop(0, "rgba(0,0,0,"+brightness+")");
      alphaGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = alphaGrad;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();

      var colorGrad = fogOfWarContext.createRadialGradient(x, y, 0, x, y, size);
      colorGrad.addColorStop(0, "rgba("+r+","+g+","+b+","+a+")");
      colorGrad.addColorStop(1, "rgba("+r+","+g+","+b+",0)");
      ctx.fillStyle = colorGrad;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fill();
   }
   ctx.closePath();
}

function drawLighting() {
   // Calculate lights
   var lsAng = player.aimAng + constants.PLAYER_LAMP_FOV, leAng = player.aimAng - constants.PLAYER_LAMP_FOV;

   fogOfWarContext.globalCompositeOperation = 'copy';
   fogOfWarContext.fillStyle = "#000";
   fogOfWarContext.fillRect(0, 0, fogOfWar.width, fogOfWar.height);
   fogOfWarContext.globalCompositeOperation = 'destination-out';

   // Ambient light
   drawPointLight(player.x, player.y, 1, 0, 0, 0, 0, constants.PLAYER_AMB_DIST, fogOfWarContext);

   // Lamp light
   var lampPoints = new Array();
   lampPoints.push([player.x, player.y]);

   var angInc = (leAng - lsAng) / constants.PLAYER_LAMP_RES;
   for (var ang = lsAng; ang > leAng; ang += angInc) {
      lampPoints.push(level.firstWallCollision(player.x, player.y, ang));
   }
   lampPoints.push(level.firstWallCollision(player.x, player.y, leAng));
   lampPoints.push([player.x, player.y]);

   // Draw lamp light and fog of war
   fogOfWarContext.beginPath(); {
      fogOfWarContext.moveTo(lampPoints[0][0], lampPoints[0][1]);
      for (var i = 1; i < lampPoints.length; i ++) {
         fogOfWarContext.lineTo(lampPoints[i][0], lampPoints[i][1]);
      }

      var alphaGrad = fogOfWarContext.createRadialGradient(player.x, player.y, 0, player.x, player.y, 400);
      alphaGrad.addColorStop(0, "rgba(0,0,0,1)");
      alphaGrad.addColorStop(1, "rgba(0,0,0,0)");
      fogOfWarContext.fillStyle = alphaGrad;
      fogOfWarContext.globalCompositeOperation = 'destination-out';
      fogOfWarContext.fill();

      var colorGrad = fogOfWarContext.createRadialGradient(player.x, player.y, 0, player.x, player.y, 400);
      colorGrad.addColorStop(0, "rgba(150,150,20,0.3)");
      colorGrad.addColorStop(1, "rgba(150,150,20,0)");
      fogOfWarContext.fillStyle = colorGrad;
      fogOfWarContext.globalCompositeOperation = 'lighter';
      fogOfWarContext.fill();
   }
   fogOfWarContext.closePath();
   
   // DEBUG: Light tests
   var lightAmt = Math.abs(Math.sin(now / 1000));
   drawPointLight(300, 100, lightAmt * 1, 200, 0, 0, lightAmt * 0.3, 100, fogOfWarContext);
   drawPointLight(400, 100, lightAmt * 1, 0, 200, 0, lightAmt * 0.3, 100, fogOfWarContext);
   drawPointLight(500, 100, lightAmt * 1, 0, 0, 200, lightAmt * 0.3, 100, fogOfWarContext);
}

var drawFPS = true;
var lastTime = new Date().getTime(), now;
var enemySpawnDelay = 0, enemySpawnCount = 1;
var scrollX = 0, scrollY = 0;
function update() {
   now = new Date().getTime();
   var dt = now - lastTime;

   // Clear
   context.fillStyle = "#000";
   context.fillRect(0, 0, canvas.width, canvas.height);

   // Spawn new enemies
   /*
   enemySpawnDelay = Math.max(0, enemySpawnDelay - dt);
   if (enemySpawnDelay == 0) {
      for (var i = 0; i < enemySpawnCount; i ++) {
         // TODO: Better way to spawn these guys
         addEnemy(Math.random() * level.width - 1, Math.random() * level.height - 1);
      }
      enemySpawnDelay = constants.ENEMY_SPAWN_DELAY;
      enemySpawnCount += 0.1;
   }
   */

   // Update
   player.update(dt, level);
   for (var i = 0; i < enemies.length; i ++) {
      if (enemies[i].isAlive)
         enemies[i].update(dt, level, player);
      else {
         enemies.splice(i, 1);   // remove dead enemy (TODO: move to freelist?)
         i --;                   // counter the impending i++
      }
   }
   for (var i = 0; i < bullets.length; i ++) {
      if (bullets[i].isAlive)
         bullets[i].update(dt, level);
      else {
         bullets.splice(i, 1);   // remove dead bullet (TODO: move to freelist?)
         i --;                   // counter the impending i++
      }
   }

   // Draw
   context.save(); {
      // Keep player centered
      scrollX = player.x - canvas.width / 2;
      scrollY = player.y - canvas.height / 2;
      context.translate(-scrollX, -scrollY);

      level.draw(player);
      player.draw();
      for (var i = 0; i < enemies.length; i ++) {
         enemies[i].draw();
      }
      for (var i = 0; i < bullets.length; i ++) {
         bullets[i].draw();
      }  
      
      // Draw lighting
      drawLighting();
      //context.globalAlpha = 0.95;    // if you want to see the map below, play with this
      context.drawImage(fogOfWar, 0, 0);
      //context.globalAlpha = 1;
   }
   context.restore();

   // UI
   context.strokeStyle = "#000";
   context.fillStyle = "#aa0";
   context.fillRect(10, 10, player.shootDelay * 100 / constants.PLAYER_SHOOT_DELAY, 10);
   context.strokeRect(10, 10, 100, 10);
   
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

   canvas.style.cursor = "crosshair";

   canvas.onmousedown = mouseDown;
   canvas.onmouseup = mouseUp;
   canvas.onmousemove = mouseMoved;
   document.onkeydown = keyDown;
   document.onkeyup = keyUp;

   getConstantsFromDOM();
   init();

   setInterval(update, 10);
}
