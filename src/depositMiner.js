var a = require('actions');
var t = require('types');
var u = require('utils');

var rDM = {
    name: "depositMiner",
    type: "depositMiner",
    target: () => 0,

    /** @param {Creep} creep **/
    run: function(creep) {
        if (_.sum(creep.store) === 0 && creep.ticksToLive < 130){//if old and no store, suicide
            creep.suicide()
            return;
        }
        if(creep.memory.target === 0){
            if(_.sum(creep.store) === creep.store.getCapacity()){
                creep.memory.target === 1
            }
        }
        switch(creep.memory.target){
            case 0:
                //newly spawned or empty store
                let flagName = creep.memory.city + 'deposit';
                if(!Game.flags[flagName]){//if there is no flag, change city.memory.depositMiner to 0, and suicide
                    Game.spawns[creep.memory.city].memory.depositMiner = 0;
                    creep.suicide();
                    return;
                }
                if (Game.flags[flagName].pos.roomName !== creep.pos.roomName){//move to flag until it is visible
                    creep.moveTo(Game.flags[flagName], {reusePath: 50}, {range: 1})
                    return;
                }
                let deposit = Game.flags[flagName].room.lookForAt(LOOK_DEPOSITS, Game.flags[flagName].pos);//if flag is visible, check for deposit, if no deposit, remove flag
                if(!deposit.length){
                    Game.flags[flagName].remove();
                    return;
                }
                //move towards and mine deposit (actions.harvest)
                actions.harvest(deposit[0]);
                break;
            case 1:
                //store is full
                if(_.sum(creep.store) === 0){
                    creep.memory.target = 0;
                    return;
                }
                actions.charge(creep, Game.spawns[creep.memory.city].room.storage)

        }
    },

};
module.exports = rDM;