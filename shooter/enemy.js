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
      this.animTime = 0;      // used for animating legs
   }

   this.hitWith = function(bullet) {
      this.isAlive = false;

      // TODO: blood, gore, etc
   }

   this.update = function(dt, level, player) {
      this.animTime += dt;

      // Find best path to player using nodes
      var toPlayer = bestPath(getClosestNode(this, level), getClosestNode(player, level));
      
      // For now, head for the 1st node that isn't our current one (we're at node 0)
      // TODO: Make sure we hit our waypoint (or close to it) first (so we don't keep trying to cut those corners)
      if (toPlayer != null && toPlayer.length > 1) {
         var toWaypoint = new Line(this.x, this.y, toPlayer[1].x, toPlayer[1].y);
         this.aimAt = [toWaypoint.x2, toWaypoint.y2];
         setEntityGoalAng(this, toWaypoint.ang);

         moveEntity(this, dt);
      }
      else {
         // For now, just sit there
         // TODO: Attack! (if nearby)
         this.aimAt = [this.x, this.y];      // so we don't get undefined values here
      }

      /*
      // Aim toward player if path is clear, or to the side of whatever enemy is blocking the player
      var pathToPlayer = new Line(this.x, this.y, player.x, player.y);
      var bestPath = getPathToAvoidCollision(this, pathToPlayer);
      this.aimAt = [bestPath.x2, bestPath.y2];
      setEntityGoalAng(this, bestPath.ang);
      */

      /*
      // Avoid collision with nearby enemies
      var hit = false;
      for (var i = 0; i < enemies.length; i ++) {
         if (this != enemies[i] && entitiesAreColliding(this, enemies[i]))
            hit = true;
      }

      // Avoid collision with nearby walls
      for (var i = 0; i < walls.length; i ++) {
         if (walls[i].entityOverlap(this, this.size) != null)
            hit = true;
      }

      // If we would have hit someone, back off and stop to let them pass
      if (hit) {
         moveEntity(this, -dt);
      }
      */
   }

   this.draw = function() {
      if (this.isAlive) {
         context.save(); {
            context.translate(this.x, this.y);
            context.rotate(this.moveAng);
            context.fillStyle = constants.ENEMY_COLOR;
            context.strokeStyle = "#000000";

            // Legs
            var LEG_BEND = Math.PI / 10, WALK_RANGE = this.size / 3;
            var upperLen = this.size * 1.5, lowerLen = this.size * 2.2;
            var walkCycleAng = this.animTime * constants.ENEMY_SPEED / 10;

            context.lineWidth = 2;
            context.beginPath(); {
               for (var i = 0, angAmt = 0, legAng = Math.PI / 4;
                     i < 4;
                     i ++, angAmt += Math.PI/1.5, legAng += Math.PI/6) {     // TODO: Play with angAmt to adjust leg motion (ie: so some go foward while others go back)
                  var walkAmt = Math.cos(walkCycleAng + angAmt);
                  var posX = Math.cos(legAng) * this.size * 2 + walkAmt * WALK_RANGE;
                  var posY = Math.sin(legAng) * this.size * 2;
                  var pos1X = Math.cos(legAng) * this.size * 1.4 + walkAmt * WALK_RANGE/2 + WALK_RANGE/2 * (i < 2 ? 1 : -1);
                  var pos1Y = Math.sin(legAng) * this.size * 1.4;
                  context.moveTo(0, 0);
                  context.lineTo(pos1X, pos1Y);
                  context.lineTo(posX, posY);

                  walkAmt = Math.cos(walkCycleAng + Math.PI - angAmt);
                  posX = Math.cos(-legAng) * this.size * 2 + walkAmt * WALK_RANGE;
                  posY = Math.sin(-legAng) * this.size * 2;
                  pos1X = Math.cos(-legAng) * this.size * 1.4 + walkAmt * WALK_RANGE/2 + WALK_RANGE/2 * (i < 2 ? 1 : -1);
                  pos1Y = Math.sin(-legAng) * this.size * 1.4;
                  context.moveTo(0, 0);
                  context.lineTo(pos1X, pos1Y);
                  context.lineTo(posX, posY);
               }

               context.stroke();
            }
            context.closePath();
            context.lineWidth = 1;

            // Body
            context.beginPath(); {
               context.arc(0, 0, this.size, 0, Math.PI * 2, false);
               context.fill();
               context.stroke();
            }
            context.closePath();
         }
         context.restore();

         // DEBUG: pathing
         /*
         context.strokeStyle = this.aimAt[0] == player.x && this.aimAt[1] == player.y ? "#00ff00" : "#ff0000";
         context.beginPath(); {
            context.moveTo(this.x, this.y);
            context.lineTo(this.aimAt[0], this.aimAt[1]);
            context.stroke();
         }
         context.closePath();
         */
      }
   }
}
