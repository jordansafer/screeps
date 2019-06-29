var actions = require('actions');
var t = require('types');
var u = require('utils');

var rU = {
    name: "Upgrader",
    type: "normal",
    target: () => 0,

    /** @param {Creep} creep **/
    run: function(creep) {
      var city = creep.memory.city;
      if(creep.memory.upgrading && creep.carry.energy == 0) {
        creep.memory.upgrading = false;
      }else if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
        creep.memory.upgrading = true;
      }
      var targets = u.getWithdrawLocations(creep);
      var location = targets[creep.memory.target];
      if (!location){
        location = Game.spawns[city];  
      }
      if (creep.memory.upgrading ? actions.upgrade(creep) : actions.withdraw(creep, location) == ERR_NOT_ENOUGH_RESOURCES){
          creep.memory.target = u.getNextLocation(creep.memory.target, targets);
      };
    }
};
module.exports = rU;