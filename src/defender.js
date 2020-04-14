var u = require("./utils")
var a = require("./actions")
var motion = require("./motion")
var rH = require("./harasser")
var settings = require("./settings")
var CreepState = {
    START: 1,
    BOOST: 2,
    ENGAGE: 3,
    DORMANT: 4,
}
var CS = CreepState

var rD = {
    name: "defender",
    type: "defender",
    target: function(spawn, boosted){
        if(boosted){
            const boosts = [RESOURCE_CATALYZED_GHODIUM_ALKALIDE, RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
                RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE, RESOURCE_CATALYZED_KEANIUM_ALKALIDE]
            u.requestBoosterFill(spawn, boosts)
        }
        return 0
    },
   


    /** @param {Creep} creep **/
    run: function(creep) {//modified harasser
        const city = creep.memory.city
        const holdPoint = 9
        if (!creep.memory.state) {
            creep.memory.state = CS.START
        }
        let hostiles = []
        if(creep.memory.state != CS.DORMANT){
            hostiles = _.filter(creep.room.find(FIND_HOSTILE_CREEPS), c => !settings.allies.includes(c.owner.username))
        }
        switch (creep.memory.state) {
        case CS.START:
            rD.init(creep)
            break
        case CS.BOOST:
            rD.boost(creep)
            break
        case CS.ENGAGE:
            if(!rH.maybeRetreat(creep, hostiles)){
                if(hostiles.length && creep.pos.inRangeTo(Game.spawns[city], holdPoint)){
                    rH.aMove(creep, hostiles)
                } else {
                    motion.newMove(creep, Game.spawns[city], holdPoint)
                }
            }
            break
        case CS.DORMANT:
            rD.dormant(creep)
            return
        }
        rH.shoot(creep, hostiles)
        rH.maybeHeal(creep, hostiles)
        if(!hostiles.length && creep.hits == creep.hitsMax){
            creep.say("sleep")
            if(creep.saying == "sleep"){
                motion.newMove(creep, Game.spawns[creep.memory.city].room.controller, 2)
            }
            if(creep.pos.inRangeTo(Game.spawns[creep.memory.city].room.controller, 2)){
                creep.memory.state = CS.DORMANT
            }
        }
    },


    init: function(creep){//same init as harasser for now
        if(!creep.memory.target){
            creep.memory.target = null
        }
        if(!creep.memory.anger){//the more angry the creep gets, the more aggressive it'll get
            creep.memory.anger = 0//anger increases when hostiles run away, and decreases when hostiles give chase (see rH.aMove)
        }
        if(creep.memory.needBoost){
            creep.memory.state = CS.BOOST
        } else {
            creep.memory.state = CS.ENGAGE
        }
    },

    boost: function(creep){
        if(creep.memory.boosted){
            creep.memory.state = CS.ENGAGE
            return
        }
        a.getBoosted(creep)
        return
        //get boosted, may get boosted using same method as offensive creeps
    },

    engage: function(creep){
        return creep
        //TODO
        //attack designated weak target, or nearest target if no designation
    },

    dormant: function(creep){
        if(Game.spawns[creep.memory.city].memory.towersActive){
            creep.memory.state = CS.ENGAGE
        }
        return creep
        //if in a safe space, hibernate until towers active
    },

    iOwn: function(roomName) {
        var room = Game.rooms[roomName]
        return (room && room.controller && room.controller.my)
    }
}
module.exports = rD