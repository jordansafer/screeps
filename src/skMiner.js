var a = require("./actions")
var sq = require("./spawnQueue")

var rSM = {
    name: "skMiner",
    type: "skMiner",
    target: () => 0,

    /** @param {Creep} creep **/
    run: function(creep) {
        // Use the spawn queue to set respawn at 20 ttl
        if(creep.ticksToLive == (creep.body.length * 3) + 5 && Game.spawns[creep.memory.city].memory[rSM.name] > 0) {
            sq.respawn(creep)
        }
        if(creep.memory.source == null) {
            rSM.nextSource(creep)
        } else if (Game.getObjectById(creep.memory.source) == null){
            creep.moveTo(new RoomPosition(25, 25, creep.memory.sourceRoom), {reusePath: 50}) 
        } else {
            rSM.harvestTarget(creep)
        }
    },

    harvestTarget: function(creep) {
        var source = Game.getObjectById(creep.memory.source)
        const lair = _.find(source.room.find(FIND_STRUCTURES), s => s.structureType == STRUCTURE_KEEPER_LAIR && s.pos.inRangeTo(source, 5))
        const enemy = _.find(source.room.find(FIND_HOSTILE_CREEPS), s => s.getActiveBodyparts(ATTACK) && s.pos.inRangeTo(source, 5))
        if((lair && lair.ticksToSpawn < 10) || enemy){
            creep.moveTo(new RoomPosition(25, 25, source.pos.roomName))
            return
        }
        a.harvest(creep, source)
        rSM.repContainer(creep, source)
    },
    
    repContainer: function(creep, source){
        let container = null
        if(creep.memory.container){
            container = Game.getObjectById(creep.memory.container)
            if(container && !creep.pos.isEqualTo(container.pos) && creep.pos.isNearTo(source)){
                creep.moveTo(container)
            }
        } else {
            container = _.find(source.room.find(FIND_STRUCTURES), s => s.structureType == STRUCTURE_CONTAINER && s.pos.isNearTo(source))
            if(container){
                creep.memory.container = container.id
            }
        }
        if(container && creep.store.energy && container.hitsMax - container.hits > 1000){
            creep.repair(container)
        } else if(!container){
            const cSite = _.find(source.room.find(FIND_CONSTRUCTION_SITES), s => s.structureType == STRUCTURE_CONTAINER && s.pos.isNearTo(source))
            if(cSite && creep.store.energy){
                creep.build(cSite)
            } else if(!cSite && creep.pos.isNearTo(source)){
                creep.pos.createConstructionSite(STRUCTURE_CONTAINER)
            }
        }
    },

    /** pick a target id for creep **/
    nextSource: function(creep) {
        var city = creep.memory.city
        var miners = _.filter(Game.creeps, c => c.memory.role == rSM.name)
        var occupied = []
        _.each(miners, function(minerInfo){
            occupied.push(minerInfo.memory.source)
        })
        var sources = Object.keys(Game.spawns[city].memory.skSources)
        var openSources = _.filter(sources, Id => !occupied.includes(Id))
        //Log.info(sources)
        if (openSources.length){
            creep.memory.source = openSources[0]
            creep.memory.sourceRoom = Game.spawns[city].memory.skSources[openSources[0]].roomName
        }
    }
}
module.exports = rSM