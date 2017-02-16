var image = getImage( "images/shooter.png" ),
    shootImage = getImage( "images/shooter_firing.png" );
var MAX_AMMO = 30,
    RELOAD_TIME = 1500,
    SHOOT_DELAY = 150,
    SHOOT_ACCURACY = 0.1,
    MOVING_ENGAGE_RANGE = 300,      // ignore enemies outside this range when moving
    IDLE_ENGAGE_RANGE = 1000;       // ignore enemies outside this range when not moving

function Shooter() {
   this.turnSpeed = 0.008;

   this.ammo = MAX_AMMO;
   this.reloadTime = RELOAD_TIME;
   this.bullets = new Array();
   this.shootDelay = SHOOT_DELAY;
   this.idleTime = 0;               // time since we last moved or shot

   this.moveGoal = null;
   this.isSelected = false;
}
Shooter.prototype = new Actor();

Shooter.prototype.spawn = function( x, y ) {
   this.x = x;
   this.y = y;
   this.ang = 0;
   this.size = image.width / 2;
   this.health = 100;
   this.moveSpeed = 0.1;
   this.pathTimer = 0;
}

Shooter.prototype.eat = function( world ) {
   // Die
   this.health = 0;

   // Go *splat*
   var bgContext = world.levelBG.getContext( '2d' );
   for ( var i = 0; i < 100; i ++ ) {
      var r = 150 + Math.floor( Math.random() * 100 );
      bgContext.beginPath(); {
         bgContext.fillStyle = "rgba(" + r + ", 0, 0, 0.1 )";
         var ang = Math.random() * Math.PI * 2;
         var dist = Math.random() * this.size * 0.7;
         bgContext.arc( this.x + Math.cos( ang ) * dist,
                        this.y + Math.sin( ang ) * dist,
                        (this.size - dist) * Math.random() * 0.2,
                        0, Math.PI * 2, true );
         bgContext.fill();
      }
      bgContext.closePath();
   }
}

Shooter.prototype.shoot = function( world, worm ) {
   // Aim
   this.setGoalAng( Math.atan2( worm.y - this.y, worm.x - this.x ) );
   this.updateAng( world.dt );

   // Fire
   if ( this.shootDelay <= 0 && this.ammo > 0 ) {
      var bullet = new Bullet();
      var ang = this.ang + Math.random() * SHOOT_ACCURACY - SHOOT_ACCURACY/2;
      bullet.spawn( this.x + Math.cos( this.ang ) * this.size, 
            this.y + Math.sin( this.ang ) * this.size, 
            ang );
      this.bullets.push( bullet );

      this.shootDelay = SHOOT_DELAY;
      this.justShot = true;
      this.ammo --;
   }

   this.idleTime = 0;            // reset idle timer
}

// free up our old node
Shooter.prototype.unoccupyCurrentNode = function( world ) {
   var oldNode = world.level.nodeFor( this.x, this.y );
   var index = oldNode.occupants.indexOf( this );
   oldNode.occupants.splice( index, 1 );
}

// occupy our (potentially) new node
Shooter.prototype.occupyCurrentNode = function( world ) { 
   var newNode = world.level.nodeFor( this.x, this.y );
   var index = newNode.occupants.indexOf( this );

   if ( index < 0 ) {      // don't add if we're already there
      newNode.occupants.push( this );
   }
}

Shooter.prototype.move = function( world ) {
   // Aim
   this.updateAng( world.dt );

   // Move (only if we're facing the right way)
   if ( this.ang === this.goalAng ) {

      // Also: make sure we aren't going to run into another shooter
      for ( var i = 0; i < world.shooters.length; i ++ ) {
         var shooter = world.shooters[i];

         //if ( shooter !=== this &&
      }

      this.unoccupyCurrentNode( world );

      var dx = this.moveSpeed * world.dt * Math.cos( this.ang );
      var dy = this.moveSpeed * world.dt * Math.sin( this.ang );
      this.x += dx;
      this.y += dy;

      // Snap to goal
      if ( Math.abs( this.x - this.moveGoal[ 0 ] ) < Math.abs( dx ) &&
           Math.abs( this.y - this.moveGoal[ 1 ] ) < Math.abs( dy ) ) {
         this.x = this.moveGoal[ 0 ];
         this.y = this.moveGoal[ 1 ];
         this.moveGoal = null;
         this.occupyCurrentNode( world );    // only occupy a node when we've stopped moving
      }
   }

   this.idleTime = 0;            // reset idle timer
}

// Shooter-specific update tasks
Shooter.prototype.updateShooter = function( world ) {
   if ( this.health > 0 ) {
      this.occupyCurrentNode( world );       // make other actors go around us
      this.justShot = false;

      // 0. If we're out of ammo, reload 
      // (we can't outrun a worm, so we always want to be ready to shoot!)
      if ( this.ammo == 0 ) {
         this.reloadTime -= world.dt;

         if ( this.reloadTime <= 0 ) {
            this.ammo = MAX_AMMO;
            this.reloadTime = RELOAD_TIME;
         }

         // Can't shoot or move while reloading, so we're done
         return;
      }

      // 1. Look for enemies within range (range is less if we're moving)
      var engageRange = this.moveGoal == null ? IDLE_ENGAGE_RANGE : MOVING_ENGAGE_RANGE;

      var worm = null, bestDist = engageRange;
      for ( var i = 0; i < world.worms.length; i ++ ) {
         var w = world.worms[ i ];

         var sight = new Line( this.x, this.y, w.x, w.y );
         var canSeeWorm = !world.level.lineHitsLevel( sight, 0 );
         if ( canSeeWorm ) {
            var distToWorm = sight.len;
            if ( w.health > 0 && distToWorm < bestDist ) {
               bestDist = distToWorm;
               worm = w;
            }
         }
      }

      // 2. If an enemy is within range, stop moving and shoot at it
      this.shootDelay = Math.max( 0, this.shootDelay - world.dt );

      if ( worm != null ) {
         this.shoot( world, worm );
      }

      // 3. Otherwise, continue moving (if applicable)
      else if ( this.moveGoal != null ) {
         // Try to find a route to (or near) our move goal
         if ( this.updateGoal( world, this.moveGoal[ 0 ], this.moveGoal[ 1 ] ) ) {
            this.move( world );
         }

         // If we can't find one, give up (TODO: do something smarter/more patient?)
         else {
            this.moveGoal = null;
         }
      }

      // 4. Idle tasks (e.g. reloading)
      else {
         this.idleTime += world.dt;    // update idle timer

         // If we've been idle for more than 1 second, trigger a reload
         if ( this.idleTime >= 1000 && this.ammo < MAX_AMMO * .6) {
            this.ammo = 0;
         }
      }
   }
}

Shooter.prototype.update = function( world ) {
   // Update shooter
   this.updateShooter( world );

   // Update bullets
   for ( var i = 0; i < this.bullets.length; i ++ ) {
      if ( !this.bullets[i].update( world ) ) {
         this.bullets.splice( i, 1 );
         i --;
      }
   }

   // Only remove us from the list when we're dead and all our bullets have done their thing
   return this.health > 0 || this.bullets.length > 0;
}

Shooter.prototype.draw = function( context ) {
   if ( this.health > 0 ) {
      context.save(); {
         context.translate( this.x, this.y );

         // Shooter itself
         context.save(); {
            context.rotate( this.ang );

            if ( this.justShot ) {
               context.drawImage( shootImage, -image.width/2, -image.height/2 );
            }
            context.drawImage( image, -image.width/2, -image.height/2 );
         }
         context.restore();

         // Ammo indicator
         var ammoOffset = -this.size * 0.7;
         if ( this.ammo > 0 ) {
            // show remaining bullets
            context.fillStyle = "#0f0";
            context.fillRect( ammoOffset, ammoOffset, 2, this.ammo );
         }
         else {
            // show reload progress
            context.fillStyle = "#f00";
            context.fillRect( ammoOffset, ammoOffset, 2, ( RELOAD_TIME - this.reloadTime) / RELOAD_TIME * MAX_AMMO );
         }

         // Selection indicator
         if ( this.isSelected ) {
            context.beginPath(); {
               context.strokeStyle = "#fa0";
               context.arc( 0, 0, this.size, 0, Math.PI*2, true );
               context.stroke();
            }
            context.closePath();
         }
      }
      context.restore();

      // DEBUG: Current path
      if ( this.path != null ) {
         drawPath( context, this.path );
      }
   }

   for ( var i = 0; i < this.bullets.length; i ++ ) {
      this.bullets[i].draw( context );
   }
}
