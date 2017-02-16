var WIDTH = 10, HEIGHT = 8, SIZE = 64;

var map = new Array(WIDTH);
for (var x = 0; x < WIDTH; x ++) {
   map[x] = new Array(HEIGHT);
   for (var y = 0; y < HEIGHT; y ++) {
      map[x][y] = new MazePart();
   }
}

function MazePart() {
   this.hasTop = false;
   this.hasLeft = false;
   this.hasRight = false;
   this.hasBottom = false;
}

function setMazePart(x, y) {
   var dir = Math.floor(Math.random() * 4);

   for (var i = 0; i < 4; i++, dir = (dir + 1) % 4) {
      if (dir == 0) {
         if (y == 0)
            continue;      // invalid, try next direction
         var above = map[x][y-1];
         if (above.hasTop || above.hasLeft || above.hasRight || above.hasBottom)
            continue;      // invalid, try next direction
         map[x][y].hasTop = above.hasBottom = true;
         setMazePart(x, y-1);
      }
      if (dir == 1) {
         if (x == WIDTH-1)
            continue;      // invalid, try next direction
         var toRight = map[x+1][y];
         if (toRight.hasTop || toRight.hasLeft || toRight.hasRight || toRight.hasBottom)
            continue;      // invalid, try next direction
         map[x][y].hasRight = toRight.hasLeft = true;
         setMazePart(x+1, y);
      }
      if (dir == 2) {
         if (y == HEIGHT-1)
            continue;      // invalid, try next direction
         var below = map[x][y+1];
         if (below.hasTop || below.hasLeft || below.hasRight || below.hasBottom)
            continue;      // invalid, try next direction
         map[x][y].hasBottom = below.hasTop = true;
         setMazePart(x, y+1);
      }
      if (dir == 3) {
         if (x == 0)
            continue;      // invalid, try next direction
         var toLeft = map[x-1][y];
         if (toLeft.hasTop || toLeft.hasLeft || toLeft.hasRight || toLeft.hasBottom)
            continue;      // invalid, try next direction
         map[x][y].hasLeft = toLeft.hasRight = true;
         setMazePart(x-1, y);
      }
   }
}

window.onload = function() {
   canvas = document.getElementById("game");
   context = canvas.getContext("2d");

   setMazePart(0, 0);

   for (var x = 0; x < WIDTH; x ++) {
      for (var y = 0; y < HEIGHT; y ++) {
         var left = x * SIZE;
         var midx = left + SIZE/2 + 0.5;
         var right = left + SIZE;
         var top = y * SIZE;
         var midy = top + SIZE/2 + 0.5;
         var bottom = top + SIZE;

         var conns = 0;
         context.beginPath(); {
            if (map[x][y].hasLeft) {
               context.moveTo(midx, midy);
               context.lineTo(left, midy);
               conns ++;
            }
            if (map[x][y].hasRight) {
               context.moveTo(midx, midy);
               context.lineTo(right, midy);
               conns ++;
            }
            if (map[x][y].hasTop) {
               context.moveTo(midx, midy);
               context.lineTo(midx, top);
               conns ++;
            }
            if (map[x][y].hasBottom) {
               context.moveTo(midx, midy);
               context.lineTo(midx, bottom);
               conns ++;
            }
            context.stroke();
         }
         context.closePath();

         // Rooms at "leaf" nodes, and random places
         if (conns == 1 || Math.random() < 0.1) {
            context.fillRect(left, top, SIZE, SIZE);
         }
      }
   }
}
