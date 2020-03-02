//const sq = require("./spawnQueue"); sq.initialize(Game.spawns['E7N50']); sq.schedule(Game.spawns['E7N50'], 'quad')
const u = require("./utils")
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
                        if((i == 0 || j == 0 || i == 49 || j == 49) && matrix.get(i,j) == 2){
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
                    if(u.isOnEdge(new RoomPosition(i, j, roomName))){
                        costs.set(i, j, posCost + 1)
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
        const quad = [creep, Game.getObjectById(creep.memory.privates[0]),
                Game.getObjectById(creep.memory.privates[1]),
                Game.getObjectById(creep.memory.privates[2])]

        for(let i = 0; i < quad.length; i++){
            if(!quad[i]){
                console.log("yolo")
                return
            }
            if(!Cache[quad[i].room.name] || !Cache[quad[i].room.name].quadMatrix){
                rQ.getRoomMatrix(quad[i].room.name)
            }
        }

        const status = rQ.getQuadStatus(quad)
        const leader = status.leader
        const spawn = Game.spawns[leader.memory.city]
        if(leader.room.name == spawn.room.name){
            //if at home, choose an exit and go to it
            const exits = Game.map.describeExits(leader.room.name)
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
            if(targetRoom){
                //go to targetRoom
                //find exit point
                targetPos = null
                const matrix = rQ.getRoomMatrix(leader.pos.roomName)
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
                        if((i == 0 || j == 0 || i == 49 || j == 49) && matrix.get(i,j) < 7){
                            targetPos = new RoomPosition(i, j, leader.pos.roomName)
                        }
                    }
                }
                //move to exit point
                console.log(targetPos)
                if(!targetPos){
                    return
                }
                Log.info(JSON.stringify(targetPos))
                const status = rQ.getQuadStatus(quad)
                if(!status.leader){
                    return
                }
                rQ.move(quad, targetPos, status, 0)
            } else {
                //go to rally point (at home)
            }
        }
    },

    moveByPath: function(leader, quad, path){
        for(let i = 0; i < quad.length; i++){
            if(quad[i].fatigue){
                return
            }
        }
        let direction = null
        if(leader.pos.isNearTo(path[0])){
            direction = leader.pos.getDirectionTo(path[0])
        } else {
            for(let i = 0; i < path.length; i++){
                if(leader.pos.isEqualTo(path[i]) && i < path.length - 1){
                    direction = path[i].getDirectionTo(path[i + 1])
                    break
                }
            }
        }
        if(direction){
            for(let i = 0; i < quad.length; i++){
                quad[i].move(direction)
            }
        }
    },

    move: function(quad, target, status, range){
        if(!range){
            range = 0
        }
        const search = PathFinder.search(status.leader.pos, {pos: targetPos, range: 0}, {
            maxRooms: 4,
            roomCallback: function(roomName){
                let costs = rQ.getRoomMatrix(status.leader.pos.roomName)
                if(status.roomEdge){
                    //if formation is on a roomEdge, and any of members is in a room but not on it's edge, we cannot move into that room
                    //unless they are all in that room
                    for(let i = 0; i < quad.length; i++){
                        if(!status.sameRoom && quad[i].pos.roomName == roomName && !u.isOnEdge(quad[i].pos)){
                            return false
                        }
                    }
                    //otherwise, if this is leader's room, block necessary positions to limit motion in appropriate fashion
                    //see: getQuadStatus()
                    if(status.leader.pos.roomName == roomName){
                        const leader = status.leader
                        for(let i = -1; i < 2; i++){
                            for(let j = -1; j < 2; j++){
                                if(leader.pos.x + i > 0 && leader.pos.x + i < 50 && leader.pos.y + j > 0 && leader.pos.y + j < 50){
                                    const direction = leader.pos.getDirectionTo(new RoomPosition(leader.pos.x + i, leader.pos.y + j, roomName))
                                    let tolerance = 0
                                    if(status.sameRoom){
                                        tolerance = 1
                                    }
                                    if(Math.abs(direction - status.roomEdge) > tolerance && (!tolerance || Math.abs(direction - status.roomEdge) != 7)){
                                        //because TOP == 1 and TOP_LEFT == 8, a difference of 7 actually signals adjacency
                                        //unwalkable
                                        costs.set(leader.pos.x + i, leader.pos.y + j, 255)
                                    }
                                }
                            }
                        }
                    }
                }
                if(Game.rooms[roomName]){
                    //if we have vision, add creeps to matrix, otherwise just return it plain
                    let quadNames = []
                    for(let i = 0; i < quad.length; i++){
                        quadNames.push(quad[i].name)
                    }
                    Game.rooms[roomName].find(FIND_CREEPS).forEach(function(creep) {
                        if(!quadNames.includes(creep.name)){
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
            new RoomVisual(search.path[i].roomName).circle(search.path[i], {fill: 'transparent', radius: 0.3, stroke: 'green'})
        }
        rQ.moveByPath(status.leader, quad, search.path)
    },

    getQuadStatus: function(quad){//return squad leader, roomEdge status, and if creeps are all in the same room
        //we need to know which creep is in which position because all pathfinding must be done based on the creep in the top left
        //roomEdge status determines which directions we can move
        //For Example: if roomEdge status == RIGHT && creeps are not all in the same room, we can only move RIGHT,
        //however, if creeps are all in the same room, we can move RIGHT, TOP_RIGHT, or BOTTOM_RIGHT
        //halting on a roomEdge will always result in the edge flipping the following tick i.e. if roomEdge == RIGHT, next tick it'll be LEFT
        let leader = null
        let highRoom = [] //creeps that are in the leftmost or topmost room of creeps in squad
        for(let i = 0; i < quad.length; i++){//if a creep's room is higher than any other squad member's room, it must be in the highest room
            const coords = u.roomNameToPos(quad[i].pos.roomName)
            for(let j = 0; j < quad.length; j++){
                const compCoords = u.roomNameToPos(quad[j].pos.roomName)
                if(coords[0] < compCoords[0] || coords[1] > compCoords[1]){
                    highRoom.push(quad[i])
                    break
                }
            }
        }
        //if highRoom is empty, all creeps are in highRoom
        if(!highRoom.length){
            highRoom = quad
        }
        //amongst creeps in highroom, find toppest leftest one
        for(let i = 0; i < highRoom.length; i++){
            let topLeft = true
            for(let j = 0; j < highRoom.length; j++){//if creep is not top, left, or top left of every other creep, it is not the leader
                if(highRoom[j].pos.getDirectionTo(highRoom[i]) != LEFT 
                    && highRoom[j].pos.getDirectionTo(highRoom[i]) != TOP_LEFT 
                    && highRoom[j].pos.getDirectionTo(highRoom[i]) != TOP
                    && !highRoom[j].pos.isEqualTo(highRoom[i])){
                    topLeft = false
                }
            }
            if(topLeft){
                leader = highRoom[i]
                break
            }
        }

        //determine roomEdge status
        let roomEdge = null //default is null, if we are not on an edge it should stay that way
        for(let i = 0; i < quad.length; i++){
            if(u.isOnEdge(quad[i].pos)){//if a creep from the squad is on an edge, it can determine which edge we are on
                if(quad[i].pos.x == 49){
                    roomEdge = LEFT
                } else if(quad[i].pos.x == 0){
                    roomEdge = RIGHT
                } else if (quad[i].pos.y == 49){
                    roomEdge = BOTTOM
                } else {
                    roomEdge = TOP
                }
                break
            }
        }
        let result = {}
        result.leader = leader
        result.roomEdge = roomEdge
        //if all of the creeps in the squad are in the highest room, they must all be in the same room
        result.sameRoom = highRoom.length < quad.length ? false : true
        return result
    }

    
}
module.exports = rQ