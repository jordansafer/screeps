//const sq = require("./spawnQueue"); sq.initialize(Game.spawns['E7N50']); sq.schedule(Game.spawns['E7N50'], 'quad')

const a = require("./actions")

var CreepState = {
    START: 1,
    BOOST: 2,
    FORM: 3,
    ENGAGE: 4,
    RALLY: 5,
    DORMANT: 6,
    PRIVATE: 7
}
var CS = CreepState

var rQ = {
    name: "quad",
    type: "quad",
    target: () => 0,
   


    /** @param {Creep} creep **/
    run: function(creep) {
        rQ.init(creep)
        switch(creep.memory.state){
        case CS.START:
            //determine whether to get boosted or go form up
            rQ.checkBoost(creep)
            break
        case CS.BOOST:
            if(!creep.memory.boosted){
                a.getBoosted(creep)
            } else {
                creep.memory.state = CS.FORM
            }
            //get boosted, then go form up
            break
        case CS.FORM:
            //find a captain
            //if no captain, become one
            //captain finds form up location, privates sign up for a private slot, then go brain dead
            //captain checks roster and moves privates to necessary positions in formation
            rQ.formUp(creep)
            break
        case CS.ENGAGE:
            const a = Game.cpu.getUsed()
            rQ.engage(creep)
            console.log(Game.cpu.getUsed() - a)
            break
        case CS.RALLY:
            //...
            break
        case CS.DORMANT:
            //...
            break
        case CS.PRIVATE:
            //mind controlled: do nothing
            break
        }
        
    },
    
    init: function(creep){
        if(!creep.memory.state){
            creep.memory.state = CS.START
        }
    },
    
    checkBoost: function(creep){
        if(creep.room.controller.level == 8){
            creep.memory.state = CS.BOOST
        } else {
            creep.memory.state = CS.FORM
        }
    },
    
    formUp: function(creep){
        //maybe creeps could make sure that their entire squad is spawned until determining a captain and forming up, until then
        //they would renew themselves (has to be done before boosting though)
        
        //form up organization:     C 0
        //(byorder in private list) 1 2
        if(creep.memory.captain){
            //find meeting position
            //choose an exit, and path as close to room center as possible from that exit. 2nd to last pos on path is rally point
            let formPos = null
            if(creep.memory.rally){
                formPos = new RoomPosition(creep.memory.rally.x, creep.memory.rally.y, creep.memory.rally.roomName)
            } else {
                const matrix = rQ.getRoomMatrix(creep.pos.roomName)
                let startPos = null
                for(let i  = 0; i < 50; i++){
                    for(let j = 0; j < 50; j++){
                        if((i == 0 || j == 0 || i == 49 || j == 49) && matrix.get(i,j) == 1){
                            startPos = new RoomPosition(i, j, creep.pos.roomName)
                        }
                    }
                }
                const path = PathFinder.search(startPos, {pos: new RoomPosition(25, 25, creep.pos.roomName), range: 1},
                        {maxRooms: 1, roomCallback: function(roomName) { return matrix }}).path
                //TODO: if path is less than 2 in length, find a new startPos and try again

                formPos = path[path.length - 2]
                creep.memory.rally = formPos
            }
            let inLine = 0
            if(!creep.pos.isEqualTo(formPos)){
                creep.moveTo(formPos)
            } else {
                inLine++
            }
            for(let i = 0; i < creep.memory.privates.length; i++){
                let privatePos = new RoomPosition(formPos.x, formPos.y, formPos.roomName)
                switch(i){
                case 0:
                    privatePos.x++
                    break
                case 1:
                    privatePos.y++
                    break
                case 2:
                    privatePos.x++
                    privatePos.y++
                    break
                }
                new RoomVisual(creep.room.name).text(i,privatePos)
                const private = Game.getObjectById(creep.memory.privates[i])
                if(!private){
                    continue
                }
                if(!private.pos.isEqualTo(privatePos)){
                    private.moveTo(privatePos)
                } else{
                    inLine++
                }
                if(inLine == 4){
                    creep.memory.state = CS.ENGAGE
                }
            }
            return
        }
        //find captain
        const captain = _.find(creep.room.find(FIND_MY_CREEPS), c => c.memory.captain)
        if(captain){//sign up as a private and go brain dead
            captain.memory.privates.push(creep.id)
            creep.memory.state = CS.PRIVATE
        } else {//if no captian, become captain
            creep.memory.captain = true
            creep.memory.privates = []
        }
    },
    
    getRoomMatrix: function(roomName){
        //always return a copy of the room matrix, in case it needs to be modified
        if(!Cache[roomName]){
            Cache[roomName] = {}
        }
        if(Cache[roomName].quadMatrix){//if there is a matrix already, just copy and return
            return Cache[roomName].quadMatrix.clone()
        } else {//no matrix? make one if we have vision
            if(!Game.rooms[roomName]){
                return false
            }
            let costs = new PathFinder.CostMatrix
            const terrain = new Room.Terrain(roomName)
            //fill matrix with default terrain values
            for(let i = 0; i < 50; i++){
                for(let j = 0; j < 50; j++){
                    switch(terrain.get(i,j)) {
                        case TERRAIN_MASK_WALL:
                            costs.set(i, j, 255)
                            break;
                        case TERRAIN_MASK_SWAMP:
                            costs.set(i, j, 5)
                            break;
                        case 0:
                            costs.set(i, j, 1)
                            break;
                    }
                }
            }
            
            //if room is visible, fill in structure info
            if(Game.rooms[roomName]){
                Game.rooms[roomName].find(FIND_STRUCTURES).forEach(function(struct) {
                    if (struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_ROAD &&
                             (struct.structureType !== STRUCTURE_RAMPART ||
                              !struct.my)) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, 255);
                    }
                });
            }
            
            //loop through everything again, if value of pos is greater than any of the positions TOP, TOP_LEFT or LEFT, then reset those postions to the value of original pos
            for(let i = 0; i < 50; i++){
                for(let j = 0; j < 50; j++){
                    const posCost = costs.get(i,j)
                    if(costs.get(Math.max(0, i - 1), Math.max(0, j - 1)) < posCost){//TOP_LEFT
                        costs.set(Math.max(0, i - 1), Math.max(0, j - 1), posCost)
                    }
                    if(costs.get(i, Math.max(0, j - 1)) < posCost){//TOP
                        costs.set(i, Math.max(0, j - 1), posCost)
                    }
                    if(costs.get(Math.max(0, i - 1), j) < posCost){//LEFT
                        costs.set(Math.max(0, i - 1), j, posCost)
                    }
                }
            }
            Cache[roomName].quadMatrix = costs
            return costs.clone()
        }
    },

    engage: function(creep){
        //TODO: check formation status. If formation is broken up, reform
        //if a member has died, go into YOLO mode
        //captain should preemptively send everybody in YOLO mode if it is at 1 ttl

        //explore exits
        const captain = creep
        const private0 = Game.getObjectById(captain.memory.privates[0])
        const private1 = Game.getObjectById(captain.memory.privates[1])
        const private2 = Game.getObjectById(captain.memory.privates[2])

        if(!private0 || !private1 || !private2){
            captain.say("yolo")
            return
        }

        if(!Cache[captain.room.name] || !Cache[captain.room.name].quadMatrix){
            rQ.getRoomMatrix(captain.room.name)
        }
        if(!Cache[private1.room.name] || !Cache[private1.room.name].quadMatrix){
            rQ.getRoomMatrix(private1.room.name)
        }
        if(!Cache[private0.room.name] || !Cache[private0.room.name].quadMatrix){
            rQ.getRoomMatrix(private0.room.name)
        }
        if(!Cache[private2.room.name] || !Cache[private2.room.name].quadMatrix){
            rQ.getRoomMatrix(private2.room.name)
        }

        const spawn = Game.spawns[captain.memory.city]
        if(captain.room.name == spawn.room.name){
            //if at home, choose an exit and go to it
            const exits = Game.map.describeExits(captain.room.name)
            const exitList = Object.keys(exits)
            let targetRoom = null
            let exit = null
            for(let i = 0; i < exitList.length; i++){
                //check for matrix in each room. if room doesn't have a matrix, explore it
                //if all rooms have matrices, go to an sk room
                const roomName = exits[exitList[i]]
                if(!rQ.getRoomMatrix(roomName)){
                    targetRoom = roomName
                    exit = exitList[i] 
                }
            }
            console.log(rQ.getRoomMatrix("E6N5"))
            console.log(targetRoom)
            if(targetRoom){
                //go to targetRoom
                //find exit point
                targetPos = null
                const matrix = rQ.getRoomMatrix(captain.pos.roomName)
                let istart = 0
                let irange = 1
                let jstart = 0
                let jrange = 1
                if(exit == TOP){
                    irange = 50
                } else if(exit == RIGHT){
                    istart = 49
                    jrange = 50
                } else if(exit == BOTTOM){
                    irange = 50
                    jstart = 49
                } else if(exit == LEFT){
                    jrange = 50
                }
                for(let i  = istart; i < irange + istart; i++){
                    for(let j = jstart; j < jrange + jstart; j++){
                        if((i == 0 || j == 0 || i == 49 || j == 49) && (matrix.get(i,j) == 1 || matrix.get(i,j) == 5)){
                            targetPos = new RoomPosition(i, j, creep.pos.roomName)
                        }
                    }
                }

                //move to exit point
                if(!targetPos){
                    return
                }
                const search = PathFinder.search(captain.pos, {pos: targetPos, range: 0}, {
                    maxRooms: 2,
                    roomCallback: function(roomName){
                        let costs = rQ.getRoomMatrix(captain.pos.roomName)
                        if(Game.rooms[roomName]){
                            //if we have vision, add creeps to matrix, otherwise just return it plain
                            Game.rooms[roomName].find(FIND_CREEPS).forEach(function(creep) {
                                if(!creep.memory || creep.memory.role != 'quad'){
                                    //quad cannot move to any pos that another creep is capable of moving to
                                    for(let i = Math.max(0 , creep.pos.x - 2); i < Math.min(50, creep.pos.x + 2); i++){
                                        for(let j = Math.max(0 , creep.pos.y - 2); j < Math.min(50, creep.pos.y + 2); j++){
                                            costs.set(i, j, 255)
                                        }
                                    }
                                }
                            });
                        }
                        for(let i = 0; i < 50; i++){
                            for(let j = 0; j < 50; j++){
                                new RoomVisual(roomName).circle(i, j, {fill: 'transparent', radius: costs.get(i,j)/255*0.5, stroke: 'red'})
                            }
                        }
                        return costs
                    }
                })
                console.log(search.path.length)
                for(let i = 0; i < search.path.length; i++){
                    new RoomVisual(captain.pos.roomName).circle(search.path[i], {fill: 'transparent', radius: 0.3, stroke: 'green'})
                }
                rQ.moveByPath(captain, private0, private1, private2, search.path)

            } else {
                //go to rally point (at home)
            }
        }
    },

    moveByPath: function(captain, private0, private1, private2, path){
        if(!captain.fatigue && !private0.fatigue && !private1.fatigue && !private2.fatigue){
            if(captain.pos.isNearTo(path[0])){
                const direction = captain.pos.getDirectionTo(path[0])
                captain.move(direction)
                private0.move(direction)
                private1.move(direction)
                private2.move(direction)
            } else {
                for(let i = 0; i < path.length; i++){
                    if(captain.pos.isEqualTo(path[i])){
                        //move to next spot
                        const direction = path[i].getDirectionTo(path[i + 1])
                        captain.move(direction)
                        private0.move(direction)
                        private1.move(direction)
                        private2.move(direction)
                    }
                }
            }
        }
    }
    
}
module.exports = rQ