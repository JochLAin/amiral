const Fractale = require('fractale');
const inquirer = require('inquirer');
const logger = require('crieur');
const middleware = (elem, ...props) => {
    if (!(elem instanceof Function)) return elem;
    elem = elem(...props);
    if (elem instanceof Promise) return () => elem;
    return elem;
};

const Field = module.exports = Fractale.create('Sergent_Command_Field', {
    label: String,
    name: String,
    type: undefined,
    required: Boolean,
    asked: undefined,
    default: undefined,
    validator: undefined,
    value: undefined,

    shortcut: String,
    argument: Boolean,

    question: undefined,
    message: undefined,
    pageSize: undefined,
    prefix: undefined,
    suffix: undefined,
    choices: undefined,
    filter: undefined,
    transformer: undefined,
    validate: undefined,
    when: undefined,
});

Field.prototype.prompt = function (answers = {}) {
    const asked = middleware(this.asked, answers);
    if (this.value || (!this.required && !asked)) return Promise.resolve();

    const recursive = () => {
        return inquirer.prompt([{
            type: 'confirm',
            name: 'continue',
            message: `Do you wanna add ${this.singular || 'an entry'}`,
            default: false
        }]).then((answers)  => {
            if (!answers.continue) return;

            const question = this.getQuestion(this.parse());
            return inquirer.prompt([question]).then((answers) => {
                this.value = answers[question.name];
                if (!this.value) this.value = [];
                this.value.push(answers[question.name]);
                return recursive();
            });
        });
    };

    if ([Array, Map].includes(this.type)) {
        return recursive();
    }

    const question = this.getQuestion(answers);
    return inquirer.prompt([question]).then((answers) => {
        this.value = answers[question.name];
    }).catch(error => {
        logger.error(error);
    });
};

Field.prototype.getQuestion = function (answers = {}) {
    let type = this.question;
    if (this.type === Boolean && !type) {
        type = 'confirm';
    }

    const question = {
        name: this.name,
        type: middleware(type, answers),
        message: this.message || middleware(this.label, answers),
        default: this.value || middleware(this.default, answers),
        choices: middleware(this.choices, answers),
        filter: middleware(this.filter, answers),
        transformer: middleware(this.transformer, answers),
        validate: middleware(this.validate, answers),
        when: middleware(this.when, answers),
        pageSize: middleware(this.pageSize, answers),
        prefix: middleware(this.prefix, answers),
        suffix: middleware(this.suffix, answers),
    };

    return Object.keys(question).reduce((accu, key) => {
        let value = question[key];
        if (value === null) value = undefined;
        return Object.assign({}, accu, { [key]: value });
    }, {});
};
