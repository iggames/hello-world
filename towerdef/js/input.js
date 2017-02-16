// var keys should be defined in game.js
var keyDown = {};
function keyDownCallback( e ) {
   for ( var k in keys ) {
      if ( e.keyCode == keys[ k ] ) {
         keyDown[ k ] = true;
      }
   }
}
function keyUpCallback( e ) {
   for ( var k in keys ) {
      if ( e.keyCode == keys[ k ] ) {
         keyDown[ k ] = false;
      }
   }
}

var mouseX, mouseY, mouseDown, mouseFirstClick;
function mouseDownCallback( e ) {
   mouseFirstClick = !mouseDown;
   mouseDown = true;
   setMousePos( e );
}
function mouseUpCallback( e ) {
   mouseFirstClick = mouseDown = false;
   setMousePos( e );
}
function mouseMovedCallback( e ) {
   mouseFirstClick = false;
   setMousePos( e );
}
function setMousePos( e ) {
   mouseX = e.pageX - canvas.offsetLeft;
   mouseY = e.pageY - canvas.offsetTop;
}
