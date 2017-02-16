var WORM_SPAWN_TIME = 4000;

function World( level ) {
   // Level
   this.level = level;
   this.level.prepareNodes();
   this.levelBG = this.level.getBackgroundImage();
   this.levelImage = this.level.getImage();

   // Shooters
   this.shooters = new Array();
   for ( var i = 0; i < this.level.shooterSpawns.length; i ++ ) {
      var spawn = this.level.shooterSpawns[ i ];
      this.spawnShooter( spawn[0], spawn[1] );
   }

   // Worms
   this.worms = new Array();
   for ( var i = 0; i < this.level.wormSpawns.length; i ++ ) {
      var spawn = this.level.wormSpawns[ i ];
      this.spawnWorm( spawn[0], spawn[1] );
   }

   // Time
   this.lastTime = new Date().getTime();

   // Scroll
   this.scrollX = 0;
   this.scrollY = 0;
}

World.prototype.spawnWorm = function( tileX, tileY ) {
   var worm = new Worm();
   worm.spawn( this.level.fromGrid( tileX ), this.level.fromGrid( tileY ) );
   this.worms.push( worm );
}
World.prototype.spawnRandomWorm = function() {
   if ( this.level.wormSpawns.length > 0 ) {
      var spawnPoint = this.level.wormSpawns[ Math.floor( Math.random() * this.level.wormSpawns.length ) ];
      this.spawnWorm( this.level.fromGrid( spawnPoint[0] ), this.level.fromGrid( spawnPoint[1] ) );
   }
}

World.prototype.spawnShooter = function( tileX, tileY ) {
   var shooter = new Shooter();
   shooter.spawn( this.level.fromGrid( tileX ), this.level.fromGrid( tileY ) );
   this.shooters.push( shooter );
}

var SCROLL_SPEED = 0.4;
World.prototype.update = function() {
   this.now = new Date().getTime();
   this.dt = this.now - this.lastTime;
   this.lastTime = this.now;

   // Scroll
   if ( keyDown[ "scrollUp" ] )      this.scrollY -= SCROLL_SPEED * this.dt;
   if ( keyDown[ "scrollDown" ] )    this.scrollY += SCROLL_SPEED * this.dt;
   if ( keyDown[ "scrollLeft" ] )    this.scrollX -= SCROLL_SPEED * this.dt;
   if ( keyDown[ "scrollRight" ] )   this.scrollX += SCROLL_SPEED * this.dt;

   // Worms
   // DEBUG: add worms with 'F' key (because it's near WASD)
   if (keyDown[ "spawnWorm" ] )     
      this.spawnWorm( this.level.gridX( mouseX + this.scrollX ), this.level.gridY( mouseY + this.scrollY ) );
   
   for ( var i = 0; i < this.worms.length; i ++ ) {
      if ( !this.worms[i].update( this ) ) {
         this.worms.splice( i, 1 );
         i --;
      }
   }

   // Shooters
   for ( var i = 0; i < this.shooters.length; i ++ ) {
      if ( !this.shooters[i].update( this ) ) {
         this.shooters.splice( i, 1 );
         i --;
      }
   }
}

World.prototype.draw = function( context ) {
   context.fillColor = "#000";
   context.fillRect( 0, 0, canvas.width, canvas.height );

   context.save(); {
      context.translate( -this.scrollX, -this.scrollY );

      context.drawImage( this.levelBG, 0, 0 );
      context.drawImage( this.levelImage, 0, 0 );
      this.level.drawNodes( context );    // DEBUG
      for ( var i = 0; i < this.shooters.length; i ++ ) {
         this.shooters[i].draw( context );
      }
      for ( var i = 0; i < this.worms.length; i ++ ) {
         this.worms[i].draw( context );
      }
   }
   context.restore();
}
