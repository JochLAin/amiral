const chalk = require('chalk');
const EventListener = require('./event_listener');

const LEVELS = {
    debug: 'blue',
    info: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red',
};

class Logger extends EventListener {
    constructor() {
        super();

        this.on('data', (chunk) => {
            console.log(chunk);
        });
        this.on('debug', (chunk) => {
            this.emit('data', chalk.blue(chunk));
        });
        this.on('info', (chunk) => {
            this.emit('data', chalk.cyan(chunk));
        });
        this.on('success', (chunk) => {
            this.emit('data', chalk.green(chunk));
        });
        this.on('warning', (chunk) => {
            this.emit('data', chalk.yellow(chunk));
        });
        this.on('error', (error) => {
            this.emit('data', chalk.red(`${chalk.red.bold(error.name)}: ${chalk.red(error.message)}`));
            this.emit('data', error.stack.split('\n').slice(1).join('\n'));
            this.emit('data', '\n');
        });
    }

    log(message) {
        return this.emit('data', message);
    }

    debug(message) {
        return this.emit('debug', message);
    }

    info(message) {
        return this.emit('info', message);
    }

    success(message) {
        return this.emit('success', message);
    }

    warning(message) {
        return this.emit('warning', message);
    }

    error(message) {
        return this.emit('error', message);
    }
}

const logger = new Logger();
module.exports = logger;
