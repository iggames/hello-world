function Actor() {
   this.goalX = 0;
   this.goalY = 0;
   this.goalAng = 0;
   this.pathTimer = 0;
}

Actor.prototype.setGoalAng = function( goal ) {
   this.goalAng = goal;

   // Fix the 0/PI*2 divide
   if (this.goalAng - this.ang > Math.PI)
      this.goalAng -= Math.PI * 2;
   if (this.ang - this.goalAng > Math.PI)
      this.goalAng += Math.PI * 2;
}

Actor.prototype.updateAng = function( dt ) {
   if (this.ang < this.goalAng) {
      this.ang += this.turnSpeed * dt;
      if (this.ang > this.goalAng)
         this.ang = this.goalAng;
   }
   else if (this.ang > this.goalAng) {
      this.ang -= this.turnSpeed * dt;
      if (this.ang < this.goalAng)
         this.ang = this.goalAng;
   }
}

Actor.prototype.nextPathStep = function(world, targetX, targetY) {
   var start = world.level.nodeFor( this.x, this.y );
   var end = world.level.nodeFor( targetX, targetY );
   this.path = bestPath( start, end );

   if ( this.path != null ) {
      // Update goal (farthest path step in our line of sight)
      var toFarthestVisiblePathStep = null;
      for ( var i = 1; i < this.path.length; i ++ ) {
         var toNextPathStep = new Line( this.x, this.y, this.path[i].x, this.path[i].y );
         if ( world.level.lineHitsLevel( toNextPathStep, this.size ) ) {
            break;
         }

         toFarthestVisiblePathStep = toNextPathStep;
      }

      if ( toFarthestVisiblePathStep == null )  debugger;
      
      return toFarthestVisiblePathStep;
   }
   else {
      console.log( "Actor couldn't find path for " + targetX + ", " + targetY + ", so giving up" );
      return null;     // couldn't find a path
   }
}

Actor.prototype.updateGoal = function( world, targetX, targetY ) {
   // If we can see our target, that's easiest
   var toTarget = new Line( this.x, this.y, targetX, targetY );
   if ( !world.level.lineHitsLevel( toTarget, this.size ) ) {
      this.path = null;
      this.goalX = targetX;
      this.goalY = targetY;
      this.setGoalAng( Math.atan2( this.goalY - this.y, this.goalX - this.x ) );

      return true;      // found a path
   }
   else {
      // bestPath is too expensive to run every frame, so wait a few updates between calls
      // At 60fps, this waits between 1/3 and 1/2 of a second before calling again
      // (the updates are spread randomly so that all the actors don't call bestPath at the same time)
      if ( this.path == null || this.pathTimer === 0 ) {
         this.pathTimer = 20 + Math.floor( Math.random() * 10 );

         var nextStep = this.nextPathStep( world, targetX, targetY );

         if ( nextStep == null ) {
            return false;
         }
         else {
            this.goalX = nextStep.x2;
            this.goalY = nextStep.y2;
            this.setGoalAng( Math.atan2( nextStep.dy, nextStep.dx ) );
         }
      }
      else {
         this.pathTimer --;
      }

      return true;      // found a path
   }
}
