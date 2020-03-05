var actions = require("./actions")
var u = require("./utils")

var rSR = {
    name: "skRunner",
    type: "robber",
    target: () => 0,

    /** @param {Creep} creep **/
    run: function(creep) {
        // notice if there's stuff next to you before wandering off!  
        if (Game.time % 2) {
            actions.notice(creep) // cost: 15% when running, so 7% now
        }

        // if there's room for more energy, go find some more
        // else find storage
        if (creep.store.energy < 0.5 * creep.store.getCapacity()) {
            const spawn = Game.spawns[creep.memory.city]
            const sources = spawn.memory.skSources
            if(sources){
                for(let i = 0; i < Object.keys(sources).length; i++){
                    let prevRoom = null
                    const room = Game.rooms[sources[Object.keys(sources)[i]].roomName]
                    if(room && room.name != prevRoom){
                        prevRoom = room.name //prevents scanning the same room twice
                        const container = _.find(room.find(FIND_STRUCTURES), s => s.structureType == STRUCTURE_CONTAINER && s.store.energy >= creep.store.getCapacity())
                        if(container){
                            actions.withdraw(creep, container, RESOURCE_ENERGY)
                            return
                        }
                    }
                }
            }
        } else {
            const storage = Game.spawns[creep.memory.city].room.storage
            if(storage){
                actions.charge(creep, storage)
            }
        }
    }
}
module.exports = rSR