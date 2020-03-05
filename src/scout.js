//1 move creep for scouting neighboring rooms

var rS = {
    name: "scout",
    type: "scout",
    target: () => 0,
    
    run: function(creep){
        const spawn = Game.spawns[creep.memory.city]
        if(!spawn.memory.neighbors){
            spawn.memory.neighbors = {}
            const exits = Game.map.describeExits(spawn.pos.roomName)
            for(let i = 0; i < Object.values(exits).length; i++){
                spawn.memory.neighbors[Object.values(exits)[i]] = {}
            }
        }
        
        if(creep.pos.roomName != spawn.pos.roomName){
            if(spawn.memory.neighbors[creep.pos.roomName]){
                //categorize room
                if(creep.room.controller){
                    spawn.memory.neighbors[creep.pos.roomName].type = "controller"
                } else if(creep.room.find(FIND_SOURCES).length){
                    spawn.memory.neighbors[creep.pos.roomName].type = "sk"
                    const sources = creep.room.find(FIND_SOURCES)
                    
                    if(!spawn.memory.skSources){
                        spawn.memory.skSources = {}
                    }
                    for(let i = 0; i < sources.length; i++){
                        spawn.memory.skSources[sources[i].id] = sources[i].pos
                    }
                } else {
                    spawn.memory.neighbors[creep.pos.roomName].type = "highway"
                }
            }
        }
        let target = null
        for(let i = 0; i < Object.keys(spawn.memory.neighbors).length; i++){
            if(!spawn.memory.neighbors[Object.keys(spawn.memory.neighbors)[i]].type){
                target = new RoomPosition(25, 25, Object.keys(spawn.memory.neighbors)[i])
            }
        }
        if(target){
            creep.moveTo(target)
        }
    }
}

module.exports = rS