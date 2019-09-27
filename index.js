const logger = require('./lib/logger');
const { Command, Field } = require('./lib');

module.exports = { logger, Command, Field };
module.exports.create = (props) => {
    const command = new Command(props);
    return command.configure();
};
