var keys = { scrollUp: 87 /* w */, scrollLeft: 65 /* a */, scrollDown: 83 /* s */, scrollRight: 68 /* d */, spawnWorm: 70 /*DEBUG: f*/  };
var levelImage;
var world;
var selectedShooter = null;

function init() {
   var level = new Level( 1, 1 );
   level.loadFromJSON( testLevel );
   world = new World( level );
   update();
}

function setShooterMoveGoals( gridX, gridY ) {
   var mainGoalX = world.level.fromGrid( gridX );
   var mainGoalY = world.level.fromGrid( gridY );

   // TODO: For now, move all shooters (eventually, move squads)
   if ( world.shooters.length > 0 ) {
      var i = 0;
      for ( var r = 0; r < 4; r ++ ) {
         for ( var xOff = -r; xOff <= r; xOff ++ ) {
            for ( var yOff = -r; yOff <= r; yOff ++ ) {
               var goalX = mainGoalX + xOff * GRID_SIZE;
               var goalY = mainGoalY + yOff * GRID_SIZE;

               var goalNode = world.level.nodeFor( goalX, goalY );

               if ( goalNode != null ) {
                  var shooter = world.shooters[ i ];
                  shooter.moveGoal = [ goalX, goalY ];
                  i ++;

                  if ( i >= world.shooters.length ) {
                     return;
                  }
               }
            }
         }
      }
   }
}

function update() {
   requestAnimationFrame( update );

   // Mouse input
   var mX = mouseX + world.scrollX;
   var mY = mouseY + world.scrollY;
   
   var mouseGridX = world.level.gridX( mX );
   var mouseGridY = world.level.gridY( mY );

   
   if ( mouseFirstClick ) {
      setShooterMoveGoals( mouseGridX, mouseGridY );
   }

   world.update();
   world.draw( context );

   stats.update();      // fps counter, see stats.js
}

window.onload = function() {
   canvas = document.getElementById("game");
   context = canvas.getContext("2d");

   canvas.onmousedown = mouseDownCallback;
   canvas.onmouseup = mouseUpCallback;
   canvas.onmousemove = mouseMovedCallback;
   document.onkeydown = keyDownCallback;
   document.onkeyup = keyUpCallback;

   Level.prototype.loadImages();

   var wait = setInterval( function() {
      if ( imagesLoaded() ) {
         Level.prototype.prepareTiles();

         init();

         clearInterval( wait );
      }
   }, 100 );
}

// TEMP
var testLevel = '{"width":40,"height":30,"map":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,0,0,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,0],[0,0,0,0,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,0],[0,0,0,0,0,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0],[0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,0,0,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"shooterSpawns":[[3,3],[3,5],[4,4],[5,3],[5,5]],"wormSpawns":[[18,20],[24,21]]}';
