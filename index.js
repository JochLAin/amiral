const program = require('caporal');
const Program = require('./lib/models/program');
const Command = require('./lib/models/program');
const Field = require('./lib/models/program');

module.exports.Program = Program;
module.exports.Command = Command;
module.exports.Field = Field;

module.exports.FLAGS = {
    FLOAT: program.FLOAT,
    INTEGER: program.INTEGER,
    BOOLEAN: program.BOOLEAN,
    ARRAY: program.ARRAY,
    REPEATABLE: program.REPEATABLE,

    BOOL: program.BOOL,
    INT: program.INT,
    LIST: program.LIST,
};

module.exports.create = (props) => {
    return new Program(props);
};
module.exports.run = (props) => {
    const program = module.exports.create(props);
    return program.run();
};
