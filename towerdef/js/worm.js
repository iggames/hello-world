function Worm() {
   this.size = this.headSize = 6 + Math.random() * 8;
   this.tailSize = 1;
   this.segments = 10 * this.headSize;
   this.sizeRate = ( this.headSize - this.tailSize ) / this.segments;

   this.MAX_SPEED = 0.07;
   this.SPEED_INC = 0.00008;        // rate at which we recover speed
   this.SPEED_REDUCTION = 0.01;     // how much we reduce speed when hit
   this.speed = this.MAX_SPEED;
   this.turnSpeed = 0.004;
   this.health = 10 * this.headSize;

   // Come up with a random brown-ish shade
   var r = 60 + Math.floor( Math.random() * 20 );
   var g = 50 + Math.floor( Math.random() * 15 );
   var b = 40 + Math.floor( Math.random() * 10 );
   this.color = "rgb(" + r + "," + g + "," + b + ")";
}
Worm.prototype = new Actor();

Worm.prototype.spawn = function( x, y ) {
   this.pos = [ [ x, y ] ];
   this.x = this.pos[0][0];
   this.y = this.pos[0][1];
   this.ang = this.goalAng = 0;
   this.pathTimer = 0;
}
Worm.prototype.setTarget = function( shooter ) {
   this.targetShooter = shooter;
}
Worm.prototype.update = function( world ) {
   if ( this.health <= 0 ) {
      return false;
   }

   this.speed = Math.min( this.MAX_SPEED, this.speed + this.SPEED_INC * world.dt );

   // Pick a shooter to head for (currently the nearest)
   var shooter = null, bestDist = 1000;
   for ( var i = 0; i < world.shooters.length; i ++ ) {
      var s = world.shooters[ i ];
      var distToShooter = new Line( this.x, this.y, s.x, s.y ).len;
      
      if ( s.health > 0 ) {
         // Are we close enough to take a bite?
         if ( distToShooter < this.headSize + s.size/3 ) {
            s.eat( world );
         }
         else if ( distToShooter < bestDist ) {
            bestDist = distToShooter;
            shooter = s;
         }
      }
   }
   
   // Go for shooter, if you can
   if ( shooter != null ) {
      this.setTarget( shooter );

      // Turn toward goal
      if ( this.updateGoal( world, this.targetShooter.x, this.targetShooter.y ) ) {
         this.updateAng( world.dt );

         // TODO: Figure out a way to make this independent of framerate
         // Update segments
         this.pos.unshift( [ this.pos[ 0 ][ 0 ] + this.speed * world.dt * Math.cos( this.ang ), 
               this.pos[ 0 ][ 1 ] + this.speed * world.dt * Math.sin( this.ang ) ] );

         if ( this.pos.length > this.segments ) {
            this.pos.pop();
         }

         this.x = this.pos[ 0 ][ 0 ];
         this.y = this.pos[ 0 ][ 1 ];
      }
   }

   return true;
}

Worm.prototype.getHit = function( line ) {
   for ( var i = 0; i < this.pos.length; i ++ ) {
      var circle = new Circle( this.pos[i][0], this.pos[i][1], this.headSize - this.sizeRate * i );
      var hit = new CircleLineCollision( circle, line );

      if ( Math.abs( hit.distFromHit ) <= this.headSize ) {
         return hit;
      }
   }

   return null;
}

Worm.prototype.hitWith = function( bullet, hit, world ) {
   // Take damage
   this.health -= bullet.damage;

   // Slow down
   this.speed = Math.max( 0, this.speed - this.SPEED_REDUCTION );
   
   // Spill blood
   var bgContext = world.levelBG.getContext( '2d' );
   for ( var i = 0; i < 10; i ++ ) {
      var g = 150 + Math.floor( Math.random() * 100 );
      var sprayAng = Math.atan2( bullet.dy, bullet.dx ) + Math.random() * 1 - 0.5;
      var sprayDist = Math.random() * 20;
      bgContext.beginPath(); {
         bgContext.fillStyle = "rgba( 100, " + g + ", 0, 0.2 )";
         bgContext.arc( hit.hitX - Math.cos( sprayAng ) * sprayDist, 
                        hit.hitY - Math.sin( sprayAng ) * sprayDist, 
                        Math.random() * 3, 
                        0, Math.PI * 2, true );
         bgContext.fill();
      }
      bgContext.closePath();
   }

   // If we just died, add a bunch more
   if ( this.health <= 0 ) {
      for ( var p = 0; p < this.pos.length; p ++ ) {
         var size = this.headSize - this.sizeRate * p;
         for ( var i = 0; i < size * 2; i ++ ) {
            var g = 150 + Math.floor( Math.random() * 100 );
            bgContext.beginPath(); {
               bgContext.fillStyle = "rgba( 100, " + g + ",  0, 0.1 )";
               bgContext.arc( this.pos[p][0] + ( Math.random() * size - size/2 ) * 4,
                              this.pos[p][1] + ( Math.random() * size - size/2 ) * 4,
                              Math.random() * 3, 
                              0, Math.PI * 2, true );
               bgContext.fill();
            }
            bgContext.closePath();
         }
      }
   }
}

Worm.prototype.drawWorm = function( context ) {
}

Worm.prototype.draw = function( context ) {
   context.strokeStyle = "#000";
   context.lineWidth = 2;
   context.fillStyle = this.color;

   // Apparently this was hurting the framerate quite a bit. Too bad, it looked cool :(
   /*
   // Outline
   for ( var i = 0; i < this.pos.length; i ++ ) {
      context.beginPath(); {
         context.arc( this.pos[i][0], this.pos[i][1], this.headSize - this.sizeRate * i, 0, Math.PI*2, true );
         context.stroke();
      }
      context.closePath();
   }
   */

   // Fill
   for ( var i = 0; i < this.pos.length; i ++ ) {
      context.beginPath(); {
         context.arc( this.pos[i][0], this.pos[i][1], this.headSize - this.sizeRate * i, 0, Math.PI*2, true );
         context.fill();
      }
      context.closePath();
   }
}

