var a = require('actions');
var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
      if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
      }
      if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
          creep.memory.building = true;
      }
      var targets = creep.room.find(FIND_STRUCTURES);
      var location = targets[0];
      creep.memory.building ? a.build(creep) : a.withdraw(creep, location);
    }
};
module.exports = roleBuilder;