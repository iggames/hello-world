var BULLET_LEN = 300,
    BULLET_SPEED = 1.3;

function Bullet() {
   this.len = 0;
   this.damage = 4;

   // Come up with a random yellow-ish color (our gradient will range from whiter solid yellow to translucent yellower yellow)
   var b = 100 + Math.floor( Math.random() * 100 );
   this.colorHead = "rgba( 255, 255, " + b + ", 0.7)";
   this.colorTail = "rgba( 255, 150, " + ( b - 100 ) + ", 0)";
}

// NOTE: Track bullet tail separately from head, so we can continue to draw the trail after the bullet has hit something
Bullet.prototype.spawn = function( x, y, ang ) {
   this.x = this.tailX = x;
   this.y = this.tailY = y;
   this.ang = ang;
   this.cAng = Math.cos( ang );
   this.sAng = Math.sin( ang );
   this.dx = this.cAng * BULLET_SPEED;
   this.dy = this.sAng * BULLET_SPEED;
   this.isAlive = true;
}

Bullet.prototype.update = function( world ) {
   var lastX = this.x;
   var lastY = this.y;
   if ( this.isAlive ) {
      this.x += this.dx * world.dt;
      this.y += this.dy * world.dt;
   }
   this.len = Math.min( BULLET_LEN, this.len + BULLET_SPEED * world.dt );
   if ( this.len >= BULLET_LEN ) {
      this.tailX += this.dx * world.dt;
      this.tailY += this.dy * world.dt;

      // If the tail has gone past the head, we're done
      if ( this.tailX < this.x === this.dx < 0 || this.tailY < this.y === this.dy < 0 ) {
         return false;
      }
   }

   // TODO: This should be temporary. Eventually, we'll have walls outside the 
   // screen that will ultimately stop the bullets.
   // Flag for removal if we are outside the level
   if ( this.x < -BULLET_LEN || this.y < -BULLET_LEN || 
        this.x > BULLET_LEN + world.level.width * GRID_SIZE || 
        this.y > BULLET_LEN + world.level.height * GRID_SIZE ) {
      return false;
   }

   // TODO: Stop moving bullets when they hit walls, but continue to show trail
   // (for now, just kill the bullet if it hits a wall)
   // NOTE: Because we want to let bullets go offscreen, we need to make sure the bullet
   // is on-screen before we check for level tiles)
   var tileX = Math.floor( this.x / GRID_SIZE );
   var tileY = Math.floor( this.y / GRID_SIZE );
   if ( tileX >= 0 && tileX < world.level.width && tileY >= 0 && tileY < world.level.height &&
        world.level.isSolidAt( tileX, tileY ) ) {
      this.isAlive = false;
   }

   // Check for hits against all worms (for now, there are only a few, so just go through the list)
   var line = new Line( this.x, this.y, lastX, lastY );
   for ( var i = 0; i < world.worms.length; i ++) {
      var worm = world.worms[ i ];
      var hit = worm.getHit( line );

      if ( hit ) {
         worm.hitWith( this, hit, world );
         this.isAlive = false;
      }
   }
   
   return true;
}

Bullet.prototype.draw = function( context ) {

   // headX/Y = where the bullet trail's head would be if it hadn't hit anything
   var headX = this.tailX + this.len * this.cAng;
   var headY = this.tailY + this.len * this.sAng;

   var grad = context.createLinearGradient( headX, headY, headX - BULLET_LEN * this.cAng, headY - BULLET_LEN * this.sAng );
   grad.addColorStop( 0, this.colorHead );
   grad.addColorStop( 1, this.colorTail );
   context.strokeStyle = grad;

   context.save(); {
      context.lineWidth = 1;
      context.beginPath(); {
         context.moveTo( this.x, this.y );
         context.lineTo( this.tailX, this.tailY );
         context.stroke();
      }
      context.closePath();
   }
   context.restore();
}
