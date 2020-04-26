var profiler = require("./screeps-profiler")

const lib0 = require("../lib/actions")
const lib1 = require("../roles/breaker")
const lib2 = require("../roles/builder")
const lib3 = require("../managers/city")
const lib4 = require("../roles/claimer")
const lib5 = require("../managers/commodityManager")
const lib6 = require("../roles/defender")
const lib7 = require("../roles/depositMiner")
const lib8 = require("../operations/error")
const lib9 = require("../buildings/factory")
const liba = require("../roles/ferry")
const libb = require("../roles/harasser")
const libc = require("../buildings/labs")
const libd = require("../buildings/link")
const libe = require("../managers/markets")
const libf = require("../roles/medic")
const libg = require("../roles/mineralMiner")
const libh = require("../buildings/observer")
const libi = require("../roles/powerCreep")
const libj = require("../roles/powerMiner")
const libk = require("../roles/quad")
const libl = require("../roles/remoteMiner")
const libm = require("../roles/robber")
const libn = require("../roles/roles")
const libo = require("../managers/roomplan")
const libp = require("../roles/runner")
const libq = require("../config/settings")
const libr = require("../roles/spawnBuilder")
const libs = require("../lib/spawnQueue")
const libt = require("../operations/stats")
const libu = require("../config/template")
const libv = require("../buildings/tower")
const libw = require("../roles/transporter")
const libx = require("../config/types")
const liby = require("../roles/unclaimer")
const libz = require("../roles/upgrader")
const libA = require("../lib/utils")

profiler.registerObject(lib0, "actions")
profiler.registerObject(lib1, "breaker")
profiler.registerObject(lib2, "builder")
profiler.registerObject(lib3, "city")
profiler.registerObject(lib4, "claimer")
profiler.registerObject(lib5, "commodityManager")
profiler.registerObject(lib6, "defender")
profiler.registerObject(lib7, "depositMiner")
profiler.registerObject(lib8, "error")
profiler.registerObject(lib9, "factory")
profiler.registerObject(liba, "ferry")
profiler.registerObject(libb, "harasser")
profiler.registerObject(libc, "labs")
profiler.registerObject(libd, "link")
profiler.registerObject(libe, "markets")
profiler.registerObject(libf, "medic")
profiler.registerObject(libg, "mineralMiner")
profiler.registerObject(libh, "observer")
profiler.registerObject(libi, "powerCreep")
profiler.registerObject(libj, "powerMiner")
profiler.registerObject(libk, "quad")
profiler.registerObject(libl, "remoteMiner")
profiler.registerObject(libm, "robber")
profiler.registerObject(libn, "roles")
profiler.registerObject(libo, "roomplan")
profiler.registerObject(libp, "runner")
profiler.registerObject(libq, "settings")
profiler.registerObject(libr, "spawnBuilder")
profiler.registerObject(libs, "spawnQueue")
profiler.registerObject(libt, "stats")
profiler.registerObject(libu, "template")
profiler.registerObject(libv, "tower")
profiler.registerObject(libw, "transporter")
profiler.registerObject(libx, "types")
profiler.registerObject(liby, "unclaimer")
profiler.registerObject(libz, "upgrader")
profiler.registerObject(libA, "utils")

module.exports = {}