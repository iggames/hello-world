var RIGHT = 0, LEFT = Math.PI, DOWN = Math.PI / 2, UP = Math.PI * 3/2, DIAG = Math.PI / 4;
function Player() {
   this.isAlive = false;
   this.size = constants.PLAYER_SIZE;
   this.turn = constants.PLAYER_TURN;
   this.speed = constants.PLAYER_SPEED;
   this.shootDelay = constants.PLAYER_SHOOT_DELAY;

   this.spawn = function(x, y) {
      this.x = x;
      this.y = y;
      this.goalAng = 0;
      this.moveAng = this.goalAng;
      this.aimAng = 0;
      this.isAlive = true;
   }

   this.update = function(dt, level) {
      // Aim
      this.aimAng = Math.atan2(mousey + scrollY - this.y, mousex + scrollX - this.x);

      // Shoot
      this.shootDelay = Math.min(constants.PLAYER_SHOOT_DELAY, this.shootDelay + dt);
      if (mouseIsDown && this.shootDelay == constants.PLAYER_SHOOT_DELAY) {
         var bullet = new Bullet();
         bullet.spawn(this.x + Math.cos(this.aimAng) * constants.PLAYER_SIZE,
               this.y + Math.sin(this.aimAng) * constants.PLAYER_SIZE, 
               this.aimAng);
         bullets.push(bullet);

         this.shootDelay = 0;
      }

      // Move
      var goalAng;
      if (isUp) {
         goalAng = UP;
         if (isLeft)       goalAng -= DIAG;
         else if (isRight) goalAng += DIAG;
      }
      else if (isDown) {
         goalAng = DOWN;
         if (isLeft)       goalAng += DIAG;
         else if (isRight) goalAng -= DIAG;
      }
      else if (isLeft)     goalAng = LEFT;
      else if (isRight)    goalAng = RIGHT;

      setEntityGoalAng(this, goalAng);

      if (isUp || isDown || isLeft || isRight) {

         // Avoid turning more than 90 degrees by just "facing the other way"
         if (this.goalAng - this.moveAng > Math.PI/2)
            this.moveAng += Math.PI;
         if (this.moveAng - this.goalAng > Math.PI/2)
            this.moveAng -= Math.PI;

         moveEntity(this, dt);
      }
   }

   this.draw = function() {
      if (this.isAlive) {
         context.save(); {
            context.translate(this.x, this.y);

            context.strokeStyle = "#000";
            context.save(); {
               context.rotate(this.moveAng);

               // Body
               context.fillStyle = constants.PLAYER_COLOR;
               context.fillRect(-this.size, -this.size, this.size*2, this.size*2);
               context.strokeRect(-this.size, -this.size, this.size*2, this.size*2);

               // Treads
               var treadSize = constants.PLAYER_TREAD_SIZE;
               context.fillStyle = constants.PLAYER_TREAD_COLOR;
               context.fillRect(-this.size - treadSize, -this.size - treadSize, this.size*2 + treadSize*2, treadSize);
               context.strokeRect(-this.size - treadSize, -this.size - treadSize, this.size*2 + treadSize*2, treadSize);
               context.fillRect(-this.size - treadSize, this.size, this.size*2 + treadSize*2, treadSize);
               context.strokeRect(-this.size - treadSize, this.size, this.size*2 + treadSize*2, treadSize);
            }
            context.restore();

            // Turret
            context.fillStyle = constants.PLAYER_COLOR;
            context.beginPath(); {
               context.arc(0, 0, this.size * 0.75, 0, Math.PI * 2, false);
               context.fill();
               context.stroke();
            }

            context.rotate(this.aimAng);
            context.fillStyle = constants.PLAYER_TREAD_COLOR;

            context.fillRect(-constants.PLAYER_TURRET_SIZE / 2, -constants.PLAYER_TURRET_SIZE / 2,
                    this.size * 2, constants.PLAYER_TURRET_SIZE);
            context.strokeRect(-constants.PLAYER_TURRET_SIZE / 2, -constants.PLAYER_TURRET_SIZE / 2,
                    this.size * 2, constants.PLAYER_TURRET_SIZE);
         }
         context.restore();
      }
   }
}
