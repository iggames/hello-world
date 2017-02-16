// TODO: make these part of a class? e.g. Collision.CircleLineCollision?

function Circle( x, y, radius ) {
   this.x = x;
   this.y = y;
   this.radius = radius;
}

function Line( x1, y1, x2, y2 ) {
   this.x1 = x1;
   this.y1 = y1;
   this.x2 = x2;
   this.y2 = y2;

   this.dx = x2 - x1;
   this.dy = y2 - y1;
   this.len = Math.sqrt( this.dx * this.dx + this.dy * this.dy );

   this.normX = this.dy / this.len;
   this.normY = -this.dx / this.len;
}

// circle - [ x, y, radius ]
// line - [ x1, y1, x2, y2 ]
function CircleLineCollision( circle, line ) {
   // Find distance from infinite line
   this.distFromHit = ( line.x1 - circle.x ) * line.normX + ( line.y1 - circle.y ) * line.normY;
   this.hitX = circle.x + line.normX * this.distFromHit;
   this.hitY = circle.y + line.normY * this.distFromHit;

   // The line is infinite, but our segment is not; if "hit" point is outside
   // our segment, use distance from ends of line
   if ( this.hitX < line.x1 ) {
      this.hitX = line.x1;
      this.hitY = line.y1;

      var x = circle.x - line.x1;
      var y = circle.y - line.y1;
      this.distFromHit = -Math.sqrt( x * x + y * y );
   }
   else if ( this.hitX > line.x2 ) {
      this.hitX = line.x2;
      this.hitY = line.y2;

      var x = circle.x - line.x2;
      var y = circle.y - line.y2;
      this.distFromHit = -Math.sqrt( x * x + y * y );
   }
}

function LineLineCollision( line1, line2 ) {
   // see: http://en.wikipedia.org/wiki/Line-line_intersection
   var x1 = line1.x1, y1 = line1.y1, x2 = line1.x2, y2 = line1.y2;
   var x3 = line2.x1, y3 = line2.y1, x4 = line2.x2, y4 = line2.y2;
   
   var c = ( x1 - x2 ) * ( y3 - y4 ) - ( y1 - y2 ) * ( x3 - x4 );

   if ( c == 0 ) { 
      // lines are parallel -- no collision
      this.isHit = false;
   }
   else {
      var a = ( x1 * y2 - y1 * x2 );
      var b = ( x3 * y4 - y3 * x4 );

      this.hitX = ( a * ( x3 - x4 ) - ( x1 - x2 ) * b ) / c;
      this.hitY = ( a * ( y3 - y4 ) - ( y1 - y2 ) * b ) / c;

      this.isHit = ( x1 <= this.hitX ) === ( this.hitX <= x2 ) &&
                   ( y1 <= this.hitY ) === ( this.hitY <= y2 );
   }
}
