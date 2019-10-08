const { Command, Field, Program } = require('./lib');

module.exports = { Command, Field, Program };
module.exports.create = (props) => {
    return new Program(props);
};
module.exports.configure = (props) => {
    const program = module.exports.create(props);
    return program.configure();
};
