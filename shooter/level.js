function MazePart() {
   this.hasTop = false;
   this.hasLeft = false;
   this.hasRight = false;
   this.hasBottom = false;
}

function Maze(width, height) {
   this.width = width;
   this.height = height;

   this.map = new Array(width);
   for (var x = 0; x < width; x ++) {
      this.map[x] = new Array(height);
      for (var y = 0; y < height; y ++) {
         this.map[x][y] = new MazePart();
      }
   }

   this.setMazePart = function(x, y) {
      var dir = Math.floor(Math.random() * 4);

      for (var i = 0; i < 4; i++, dir = (dir + 1) % 4) {
         if (dir == 0) {
            if (y == 0)
               continue;      // invalid, try next direction var above = this.map[x][y-1];
            var above = this.map[x][y-1];
            if (above.hasTop || above.hasLeft || above.hasRight || above.hasBottom)
               continue;      // invalid, try next direction
            this.map[x][y].hasTop = above.hasBottom = true;
            this.setMazePart(x, y-1);
         }
         if (dir == 1) {
            if (x == this.width-1)
               continue;      // invalid, try next direction
            var toRight = this.map[x+1][y];
            if (toRight.hasTop || toRight.hasLeft || toRight.hasRight || toRight.hasBottom)
               continue;      // invalid, try next direction
            this.map[x][y].hasRight = toRight.hasLeft = true;
            this.setMazePart(x+1, y);
         }
         if (dir == 2) {
            if (y == this.height-1)
               continue;      // invalid, try next direction
            var below = this.map[x][y+1];
            if (below.hasTop || below.hasLeft || below.hasRight || below.hasBottom)
               continue;      // invalid, try next direction
            this.map[x][y].hasBottom = below.hasTop = true;
            this.setMazePart(x, y+1);
         }
         if (dir == 3) {
            if (x == 0)
               continue;      // invalid, try next direction
            var toLeft = this.map[x-1][y];
            if (toLeft.hasTop || toLeft.hasLeft || toLeft.hasRight || toLeft.hasBottom)
               continue;      // invalid, try next direction
            this.map[x][y].hasLeft = toLeft.hasRight = true;
            this.setMazePart(x-1, y);
         }
      }
   }

   //this.setMazePart(Math.random() * this.width-1, Math.random() * this.height-1);
   this.setMazePart(0, 0);
}

function NavNode(x, y) {
   this.x = x;
   this.y = y;
   this.links = new Array();

   this.toString = function() {
      return x + "," + y;
   }
}


// TODO: Make sure nodes aren't already linked
function linkNodes(a, b) {
   a.links.push(b);
   b.links.push(a);
}

function estimateCost(a, b) {
   var x = a.x - b.x;
   var y = a.y - b.y;
   return Math.sqrt(x*x + y*y);
}

// See: http://en.wikipedia.org/wiki/A*_search_algorithm#Pseudocode
function reconstruct_path(cameFrom, current_node, toRet) {
   if (cameFrom[current_node] != null) {
      toRet.splice(0, 0, cameFrom[current_node]);
      return reconstruct_path(cameFrom, cameFrom[current_node], toRet);
   }
   else
      return toRet;
}

function bestPath(start, goal) {
   if (start == undefined) {
      console.log("ASSERT: start was undefined");
      return null;
   }
   if (goal == undefined) {
      console.log("ASSERT: goal was undefined");
      return null;
   }

   var closedSet = new Array();
   var openSet = new Array();
   openSet.push(start);
   var cameFrom = new Array();

   var g_score = new Array();
   var h_score = new Array();
   var f_score = new Array();

   g_score[start] = 0;
   h_score[start] = estimateCost(start, goal);
   f_score[start] = h_score[start];

   while (openSet.length > 0) {
      var x, xNdx = -1;

      var bestScore = Infinity;
      for (var i = 0; i < openSet.length; i ++) {
         if (g_score[openSet[i]] < bestScore) {
            x = openSet[i];
            xNdx = i;
            bestScore = g_score[x];
         }
      }

      if (x == goal) {
         var path = new Array();
         path.push(goal);
         return reconstruct_path(cameFrom, goal, path);
      }

      // move x from open to closed set
      openSet.splice(xNdx, 1);
      closedSet.push(x);

      for (var i = 0; i < x.links.length; i ++) {
         var y = x.links[i];
         
         if (closedSet.indexOf(y) != -1)
            continue;

         var tentative_g_score = g_score[x] + estimateCost(x, y);
         var tentative_is_better;

         if (openSet.indexOf(y) == -1) {
            openSet.push(y);
            tentative_is_better = true;
         }
         else if (tentative_g_score < g_score[y])
            tentative_is_better = true;
         else
            tentative_is_better = false;

         if (tentative_is_better) {
            cameFrom[y] = x;
            g_score[y] = tentative_g_score;
            h_score[y] = estimateCost(y, goal);
            f_score[y] = g_score[y] + h_score[y];
         }
      }
   }

   console.log("ASSERT: Couldn't find path from " + start + " to " + goal);
   return null;
}

var darkTiles = new Image();
darkTiles.src = "dark_tiles.png";

function Level() {
   this.hallTiles = 6;     // includes 1 for the wall
   this.tileSize = 32;
   this.hallSize = this.tileSize * this.hallTiles;

   this.spawn = function(maze) {
      this.maze = maze;
      this.nodes = new Array();

      this.width = maze.width * this.hallTiles + 1;
      this.height = maze.height * this.hallTiles + 1;

      // Prepare level array (levels are made of tiles; for now, each tile is off/on, but this will change later)
      this.tiles = new Array(this.width);
      for (var x = 0; x < this.width; x ++) {
         this.tiles[x] = new Array(this.height);
         for (var y = 0; y < this.height; y ++) {
            this.tiles[x][y] = 0;
         }
      }

      // Add nodes and fill in walls based on maze
      for (var y = 0; y < maze.height; y ++) {
         for (var x = 0; x < maze.width; x ++) {
            var node = new NavNode(
                  x * this.hallSize + this.hallSize/2 + this.tileSize/2,
                  y * this.hallSize + this.hallSize/2 + this.tileSize/2);
            this.nodes.push(node);

            // Link up with previously added nodes, or add walls
            if (maze.map[x][y].hasLeft)
               linkNodes(node, this.nodes[y*maze.height + x - 1]);
            else {
               for (var wallX = x * this.hallTiles, wallY = y * this.hallTiles;
                     wallY <= (y+1) * this.hallTiles; wallY ++) {
                  this.tiles[wallX][wallY] = 1;
               }
            }

            if (maze.map[x][y].hasTop)
               linkNodes(node, this.nodes[(y-1)*maze.height + x]);
            else {
               for (var wallX = x * this.hallTiles, wallY = y * this.hallTiles; 
                     wallX <= (x+1) * this.hallTiles; wallX ++) {
                  this.tiles[wallX][wallY] = 1;
               }
            }
         }
      }

      // Right edge
      for (var wallX = this.width - 1, wallY = 0;
            wallY < this.height; wallY ++) {
         this.tiles[wallX][wallY] = 1;
      }

      // Bottom edge
      for (var wallX = 0, wallY = this.height - 1;
            wallX < this.width; wallX ++) {
         this.tiles[wallX][wallY] = 1;
      }

      // Pre-render level to an offscreen canvas
      this.levelCanvas = document.createElement('canvas');
      this.levelCanvas.width = this.width * this.tileSize;
      this.levelCanvas.height = this.height * this.tileSize;

      var levelContext = this.levelCanvas.getContext('2d');
      for (var x = 0; x < this.width; x ++) {
         for (var y = 0; y < this.height; y ++) {
            if (this.tiles[x][y] > 0) {
            }
            else {
               levelContext.drawImage(darkTiles, 
                     Math.floor(Math.random() * 4) * this.tileSize, 
                     Math.floor(Math.random() * 4) * this.tileSize, this.tileSize, this.tileSize,
                     x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize); 
            }
         }
      }
   }

   this.draw = function(player) {
      context.drawImage(this.levelCanvas, 0, 0);

      // DEBUG: Nav Nodes
      /*
      context.strokeStyle = "#00f";
      for (var i = 0; i < this.nodes.length; i ++) {
         context.beginPath(); {
            for (var j = 0; j < this.nodes[i].links.length; j ++) {
               context.moveTo(this.nodes[i].x, this.nodes[i].y);
               context.lineTo(this.nodes[i].links[j].x, this.nodes[i].links[j].y);
            }
            context.stroke();
         }
         context.closePath();
      }
      */
   }

   this.findFirstWall = function(x, y, ang) {
      var rayX = x / this.tileSize, rayY = y / this.tileSize;
      var dirX = Math.cos(ang) / 2;
      var dirY = Math.sin(ang) / 2;

      for (var i = 0; i < 100; i ++) {
         var tileX = Math.floor(rayX);
         var tileY = Math.floor(rayY);

         if (this.tiles[tileX][tileY] > 0) {
            return [tileX, tileY];
         }

         rayX += dirX / 2;
         rayY += dirY / 2;
      }

      return null;
   }

   this.firstWallCollision = function(x, y, ang) {
      // Check every row and column for a hit
      var col = Math.floor(x / this.tileSize), row = Math.floor(y / this.tileSize);
      var dirX = Math.cos(ang), dirY = Math.sin(ang);

      var colInc = dirX < 0 ? -1 : 1;
      var rowInc = dirY < 0 ? -1 : 1;

      var bestRowHit = null, bestRowDist = Infinity, bestColHit = null, bestColDist = Infinity;

      while ((bestRowHit == null || bestColHit == null)) {
         // Try one row up/down
         if (dirY != 0) {
            row += rowInc;
            var checkY = row * this.tileSize + (dirY < 0 ? this.tileSize - 1: 0);
            var checkX = x + dirX * ((checkY - y) / dirY);

            var tileX = Math.floor(checkX / this.tileSize);
            var tileY = row;

            if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height || this.tiles[tileX][tileY] > 0) {
               var dist = new Line(x, y, checkX, checkY).len;
               if (dist < bestRowDist) {
                  bestRowHit = [checkX, checkY];
                  bestRowDist = dist;
               }
            }
         }
         else {
            bestRowHit = 0;   // it's no longer null, but since bestDist is still Infinity, it won't get picked
         }

         // Try one col left/right
         if (dirX != 0) {
            col += colInc;
            checkX = col * this.tileSize + (dirX < 0 ? this.tileSize - 1 : 0);
            checkY = y + dirY * ((checkX - x) / dirX);

            tileX = col;
            tileY = Math.floor(checkY / this.tileSize);

            if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height || this.tiles[tileX][tileY] > 0) {
               var dist = new Line(x, y, checkX, checkY).len;
               if (dist < bestColDist) {
                  bestColHit =  [checkX, checkY];
                  bestColDist = dist;
               }
            }
         }
         else {
            bestColHit = 0;   // it's no longer null, but since bestDist is still Infinity, it won't get picked
         }
      }

      return bestRowDist < bestColDist ? bestRowHit : bestColHit;
   }
}
