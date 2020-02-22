var rBr = require("./breaker")

var rPM = {
    name: "powerMiner",
    type: "powerMiner",
    target: () => 0,
   

    /** @param {Creep} creep **/
    run: function(creep) {
        rPM.init(creep)
        const medic = Game.getObjectById(creep.memory.medic)
        if(!medic){
            if(rBr.endLife(creep)){
                return
            } else {
                rBr.medicSearch(creep)
                return
            }
        }
        const canMove = rBr.canMove(creep, medic)
        let target = Game.getObjectById(creep.memory.target)//target is pBank
        if(target){
            rPM.hitBank(creep, target)
            rPM.summonRunners(creep, target)
            if(!creep.pos.isNearTo(target) && canMove){//move to target
                creep.moveTo(target, {range: 1, reusePath: 50})
                rBr.medicMove(creep, medic)
            }
        } else {
            target = rPM.findBank(creep)
            if(canMove) {
                if(target){//move to it
                    creep.moveTo(target, {range: 1, reusePath: 50})
                    rBr.medicMove(creep, medic)
                } else { //rally
                    const flag = creep.memory.city + "powerMine"
                    rBr.rally(creep, medic, flag)
                }
            }
        }
        rBr.heal(creep, medic)//breaker heal should work for now
    },

    init: function(creep){
        //initialize memory
        if(!creep.memory.medic){
            creep.memory.medic = null
        }
    },

    summonRunners: function(creep, bank){
        if(Game.time % 50 == 1 && bank && bank.hits < 600000){
            Game.spawns[creep.memory.city].memory.runner = Math.ceil(bank.power/1600)
        }
    },

    hitBank: function(creep, bank){
        if(creep.pos.isNearTo(bank.pos)){
            creep.attack(bank)
        }
    },

    roomScan: function(creep){//not in use. Will be used for self defense / harasser summon
        if(!creep.memory.onEdge && Game.time % 20 != 0){
            return []
        }
        if(!creep.memory.onEdge){
            creep.memory.onEdge = false
        }
        const hostiles = _.filter(creep.room.find(FIND_HOSTILE_CREEPS), c => c.getActiveBodyParts(ATTACK) > 0
        || c.getActiveBodyParts(RANGED_ATTACK) > 0 || c.getActiveBodyParts(HEAL) > 0 || c.pos.isNearTo(creep.pos))
        if(!hostiles.length){
            creep.memory.onEdge = false
            return []
        }
        creep.memory.onEdge = true
        return hostiles
    },

    attackHostiles: function(creep, bank, hostiles){ //not in use. Will be used for self defense / harasser summon
        if(creep && bank && hostiles)
            return
    }


}
module.exports = rPM
