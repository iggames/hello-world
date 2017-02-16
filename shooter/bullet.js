function Bullet() {
   this.isAlive = false;
   this.size = constants.BULLET_SIZE;
   this.speed = constants.BULLET_SPEED;

   this.spawn = function(x, y, ang) {
      this.x = x;
      this.y = y;
      this.goalAng = this.moveAng = ang;
      this.isAlive = true;
   }

   this.update = function(dt, level) {
      moveEntity(this, dt);

      for (var i = 0; i < enemies.length; i ++) {
         if (distBetweenEntities(this, enemies[i]) < enemies[i].size + this.size) {
            enemies[i].hitWith(this);
            this.isAlive = false;
            break;
         }
      }

      // TODO: Check for collision with level
   }

   this.draw = function(dt) {
      if (this.isAlive) {
         context.save(); {
            context.translate(this.x, this.y);

            context.strokeStyle = "#000";
            context.fillStyle = "#ab0";
            context.beginPath(); {
               context.arc(0, 0, this.size * 0.75, 0, Math.PI * 2, false);
               context.fill();
               context.stroke();
            }
         }
         context.restore();
      }
   }
}

