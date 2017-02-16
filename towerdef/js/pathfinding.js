function Node(x, y) {
   this.x = x;
   this.y = y;
   this.occupants = new Array();             // any objects occupying this node
   this.links = new Array();

   Node.prototype.toString = function() {
      return this.x + "," + this.y;
   }

   Node.prototype.estimateCost = function(other) {
      var x = this.x - other.x;
      var y = this.y - other.y;
      return Math.sqrt(x*x + y*y);
   }
}

function linkNodes(a, b) {
   if (a == null || b == null) {
      debugger;
   }

   // TODO: Make sure they aren't already linked?
   a.links.push( b );
   b.links.push( a );
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
   if ( start == undefined ) {
      console.log("ASSERT: start was undefined");
      debugger;
      return null;
   }
   if ( goal == undefined ) {
      console.log("ASSERT: goal was undefined");
      debugger;
      return null;
   }

   var closedSet = new Array();
   var openSet = new Array();
   openSet.push( start );
   var cameFrom = new Array();

   var g_score = new Array();
   var h_score = new Array();
   var f_score = new Array();

   g_score[ start ] = 0;
   h_score[ start ] = start.estimateCost( goal );
   f_score[ start ] = h_score[start];

   while ( openSet.length > 0 ) {
      var x, xNdx = -1;

      var bestScore = Infinity;
      for ( var i = 0; i < openSet.length; i ++ ) {
         if ( g_score[ openSet[ i ] ] < bestScore ) {
            x = openSet[ i ];
            xNdx = i;
            bestScore = g_score[ x ];
         }
      }

      if ( x == goal ) {
         var path = new Array();
         path.push( goal );
         return reconstruct_path( cameFrom, goal, path );
      }

      // move x from open to closed set
      openSet.splice( xNdx, 1 );
      closedSet.push( x );

      for ( var i = 0; i < x.links.length; i ++ ) {
         var y = x.links[ i ];
         
         // Ignore occupied nodes, unless they're the goal (caller should handle whether goal is valid)
         if ( ( y.occupants.length > 0 && y != goal ) || closedSet.indexOf( y ) != -1 )
            continue;

         var tentative_g_score = g_score[x] + x.estimateCost( y );
         var tentative_is_better;

         if ( openSet.indexOf( y ) == -1 ) {
            openSet.push( y );
            tentative_is_better = true;
         }
         else if ( tentative_g_score < g_score[ y ] )
            tentative_is_better = true;
         else
            tentative_is_better = false;

         if ( tentative_is_better ) {
            cameFrom[ y ] = x;
            g_score[ y ] = tentative_g_score;
            h_score[ y ] = y.estimateCost( goal );
            f_score[ y ] = g_score[ y ] + h_score[ y ];
         }
      }
   }

   console.log("ASSERT: Couldn't find path from " + start + " to " + goal);
   return null;
}

function drawPath( context, path ) {
   context.strokeStyle = "#ff0";

   var last = null;
   for ( var i = 0; i < path.length; i ++ ) { 
      var node = path[ i ];

      // Circular node representation
      context.beginPath(); {
         context.arc( node.x, node.y, 4, 0, Math.PI*2, true );
         context.fill();
         context.stroke();
      }
      context.closePath();

      // Path from prev
      if ( last != null ) {
         context.beginPath(); {
            context.moveTo( node.x, node.y );
            context.lineTo( last.x, last.y );
            context.stroke();
         }
         context.closePath();
      }

      last = node;
   }
}
