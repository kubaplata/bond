const path = require('path');
const programDir = path.join(__dirname, '.', 'programs/ramp');
const idlDir = path.join(__dirname, 'idl');
const sdkDir = path.join(__dirname, 'sdk');
const binaryInstallDir = path.join(__dirname, '.crates');

module.exports = {
idlGenerator: 'anchor',
programName: 'ramp',
programId: 'EXSphcPS7fXSnmVPqo8Q5Hax5yRnc3t4MFWD1NozvMro',
idlDir,
sdkDir,
binaryInstallDir,
programDir,
};