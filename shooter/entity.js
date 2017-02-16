function angDiff(ang1, ang2) {
   return (ang1 - ang2) % (Math.PI * 2);
}

function Hit(hitX, hitY, overlap) {
   this.hitX = hitX;
   this.hitY = hitY;
   this.overlap = overlap;
}

function Line(x1, y1, x2, y2) {
   this.x1 = x1;
   this.y1 = y1;
   this.x2 = x2;
   this.y2 = y2;

   this.dx = this.x2 - this.x1;
   this.dy = this.y2 - this.y1;
   this.len = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
   this.ang = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);

   this.normX = this.dy / this.len;
   this.normY = -this.dx / this.len;

   this.fromEdge = function(x, y) {
      return (this.x1 - x) * this.normX + (this.y1 - y) * this.normY;
   }

   // TODO: we don't really care about the overlap, since we only use that to find the path that avoids it
   //       maybe change these to return the path that avoids?

   this.entityOverlap = function(entity, threshold) {
      // Find distance from infinite line
      var fromEdge = this.fromEdge(entity.x, entity.y);
      var hitX = entity.x + this.normX * fromEdge;
      var hitY = entity.y + this.normY * fromEdge;

      // The line is infinite, but our segment is not; if "hit" point is outside our segment, just return 0
      if ((this.x1 < hitX && hitX < this.x2) || (this.x2 < hitX && hitX < this.x1)) {
         if (Math.abs(fromEdge) < entity.size + threshold) {
            var overlap = fromEdge < 0 ? -entity.size - threshold - fromEdge : -fromEdge + entity.size + threshold;
            return new Hit(hitX, hitY, overlap);
         }
         else
            return null;
      }
      else
         return null;
   }

   this.getPathToAvoidLine = function(line, threshold) {
      // Include threshold in line
      var lcat = Math.cos(line.ang) * threshold;
      var lsat = Math.sin(line.ang) * threshold;
      var fromEdge1 = this.fromEdge(line.x1 - lcat, line.y1 - lsat);
      var fromEdge2 = this.fromEdge(line.x2 + lcat, line.y2 + lsat);

      var tcat = Math.cos(this.ang) * threshold;
      var tsat = Math.sin(this.ang) * threshold;
      var fromLine1 = line.fromEdge(this.x1 - tcat, this.y1 - tsat);
      var fromLine2 = line.fromEdge(this.x2 + tcat, this.y2 + tsat);

      // If distances have opposite signs, then it crosses
      if (fromEdge1 < 0 != fromEdge2 < 0 && fromLine1 < 0 != fromLine2 < 0) {

         if (Math.abs(fromEdge1) < Math.abs(fromEdge2)) {
            return new Line(this.x1, this.y1, line.x1 - lcat, line.y1 - lsat);
         }
         else {
            return new Line(this.x1, this.y1, line.x2 + lcat, line.y2 + lsat);
         }
      }
      else
         return this;
   }
}

function distBetweenEntities(a, b) {
   var x = a.x - b.x;
   var y = a.y - b.y;

   return Math.sqrt(x*x + y*y);
}

function entitiesAreColliding(a, b) {
   return distBetweenEntities(a, b) < a.size + b.size;
}

function worstEntityOverlapForPath(entity, path) {
   var worstDist = 0;
   
   for (var i = 0; i < enemies.length; i ++) {
      if (entity != enemies[i]) {
         worstDist = Math.max(path.entityOverlap(enemies[i]), worstDist);
      }
   }
   
   return worstDist;
}

//
// Used to head toward a specific entity, but avoid hitting other entities along the way
// 
function getPathToAvoidCollision(entity, path) {
   var avoidAll = path, mostAngDiff = 0;

   // TODO: Clean this up and combine these (and maybe move into entityOverlap and lineOverlap)

   // Avoid walls
   // TODO: Sort by distance before comparing? (So we never move to avoid hitting a farther one and go into a near one)
   for (var i = 0; i < walls.length; i ++) {
      avoidAll = avoidAll.getPathToAvoidLine(walls[i], entity.size);
   }

   /*
   // Avoid enemies
   for (var i = 0; i < enemies.length; i ++) {
      if (entity != enemies[i]) {
         var hit = path.entityOverlap(enemies[i], entity.size + constants.ENEMY_PADDING);

         if (hit != null) {
            var avoidThis = new Line(path.x1, path.y1,
                    hit.hitX + hit.overlap * path.normX, hit.hitY + hit.overlap * path.normY);
            var thisAngDiff = Math.abs(angDiff(avoidThis.ang, path.ang));
            if (thisAngDiff > mostAngDiff) {
               avoidAll = avoidThis;
               mostAngDiff = thisAngDiff;
            }
         }
      }
   }
   */

   return avoidAll;
}

function setEntityGoalAng(entity, goal) {
   entity.goalAng = goal;

   // Fix the 0/PI*2 divide
   if (entity.goalAng - entity.moveAng > Math.PI)
      entity.goalAng -= Math.PI * 2;
   if (entity.moveAng - entity.goalAng > Math.PI)
      entity.goalAng += Math.PI * 2;
}

function moveEntity(entity, dt) {
   entity.moveAng %= Math.PI * 2;

   if (entity.moveAng < entity.goalAng)
      entity.moveAng = Math.min(entity.goalAng, entity.moveAng + entity.turn * dt);
   if (entity.moveAng > entity.goalAng)
      entity.moveAng = Math.max(entity.goalAng, entity.moveAng - entity.turn * dt);

   // Move forward
   entity.x += Math.cos(entity.moveAng) * entity.speed * dt;
   entity.y += Math.sin(entity.moveAng) * entity.speed * dt;
}

function getClosestNode(entity, level) {
   var nodeX = Math.floor(entity.x / level.hallSize);
   var nodeY = Math.floor(entity.y / level.hallSize);

   var closest = level.nodes[nodeY * Math.floor(level.width / level.hallTiles) + nodeX];

   if (closest == undefined) {
      console.log("Couldn't find closest node for...");
      console.log(entity);
   }

   return closest;
}

