const logger = require('./lib/logger');
const { Command, Field } = require('./lib');

module.exports = { logger, Command, Field };
module.exports.create = (props) => {
    return new Command(props);
};
module.exports.configure = (props, program) => {
    return module.exports.create(props).configure(program);
};
