class Template
{
    constructor(innerStruct) {
        this.innerStruct = innerStruct;
        this.filters = {};
        this.computedInnerStruct;

        this.addFilter('toUpperCase', function(value) {
            return value.toUpperCase();
        });
    }

    addFilter(name, callback) {
        this.filters[name] = callback;
    }

    render(data, component) {
        let result = [];

        if (this.computedInnerStruct === undefined) {
            this.computeInnerStruct(component);
        }

        for (let i = 0; i < this.computedInnerStruct.length; i++) {
            let current = this.computedInnerStruct[i];

            if (current instanceof TemplateComponentProxy) {
                result.push(current.render(data, component));
            } else if (current instanceof Template) {
                result.push(current.render(data, component));
            } else if (typeof current === "string") {
                result.push(current);
            } else {
                let value = data[current.paramName[0]] !== undefined
                    ? data[current.paramName[0]]
                    : '';

                for (let j = 1; j < current.paramName.length; j++) {
                    value = value[current.paramName[j]] !== undefined
                        ? value[current.paramName[j]]
                        : '';
                }

                for (let j = 0; j < current.filters.length; j++) {
                    if (this.filters[current.filters[j]]) {
                        value = this.filters[current.filters[j]](value);
                    }
                }

                result.push(value);
            }
        }

        return result.join('');
    }

    computeInnerStruct(component) {
        this.computedInnerStruct = [];

        for (let i = 0; i < this.innerStruct.length; i++) {
            let current = this.innerStruct[i];

            if (typeof current === "string") {
                let isParam = current.match(/{{( )*\w+(\.\w+)*(\s*\|\s*\w*)*( )*}}/g) !== null;

                if (isParam === false) {
                    let views = current.match(/<[ ]*View (\w*)[ ]*\/>/gi);

                    if (views !== null) {
                        for (let j = 0; j < views.length; j++) {
                            let pos = current.search(views[j]);

                            if (pos > 0) {
                                this.computedInnerStruct.push(current.slice(0, pos));
                                current = current.slice(pos);
                            }

                            let innerComponentName = current.slice(0, views[j].length).match(/<[ ]*View (\w*)[ ]*\/>/i)[1],
                                componentProxy = new TemplateComponentProxy(innerComponentName, component);

                            this.computedInnerStruct.push(componentProxy);

                            current = current.slice(views[j].length);
                        }

                        if (current !== "") {
                            this.computedInnerStruct.push(current);
                        }
                    } else {
                        this.computedInnerStruct.push(current);
                    }
                } else {
                    let paramList = current.match(/\w+(\.\w+)*/g),
                        paramName = paramList.shift().split('.'),
                        filters = paramList;

                    this.computedInnerStruct.push({
                        paramName: paramName,
                        filters: paramList
                    });
                }
            } else {
                this.computedInnerStruct.push(current);
            }
        }
    }
}

class TemplateComponentProxy
{
    constructor(componentName, component) {
        this.component = component.builder.create(componentName, '');
    }

    render(data, component) {
        return this.component.render(data);
    }
}

class TemplateLoop extends Template
{
    constructor(field, innerStruct) {
        super(innerStruct);
        this.field = field;
    }

    render(data, component) {
        switch (typeof data[this.field]) {
            case 'object':
                if (Array.isArray(data[this.field])) {
                    return this.renderArray(data, component);
                }
    
                return this.renderObject(data, component);
            case 'undefined':
            default:
                debugger;
                break;
        } 
        debugger;
    }

    renderArray(data, component) {
        let results = [],
            length = data[this.field].length;

        for (let i = 0; i < length; i++) {
            let item = super.render(Object.assign({'_key': i}, data[this.field][i]), component);
            results.push(item);
        }

        return results.join('');
    }

    renderObject(data, component) {
        let keys = Object.keys(data[this.field]),
            length = keys.length,
            result = [];

        for (let i = 0; i < length; i++) {
            let value = data[this.field][keys[i]],
                item = super.render(Object.assign({'_key': i, '_name': keys[i]}, value), component);

            result.push(item);
        }

        return result.join('');
    }
}

class TemplateCondition extends Template
{
    constructor(condition, innerStruct) {
        super(innerStruct);

        let field = condition.shift().split('.');

        this.field = field.shift();
        this.fieldFilter = field.shift();
        this.filters = [];

        let currentFilter = [];

        for (let i = 0; i < condition.length; i++) {
            if (['>', '>=', '==', '<=', '<'].indexOf(condition[i]) !== -1) {
                if (currentFilter.length > 0) {
                    this.filters.push(currentFilter);
                }

                this.operator = condition[i];
                this.value = condition[i + 1];
                break;
            }

            if (currentFilter.length !== 0 && ['%'].indexOf(condition[i]) !== -1) {
                this.filters.push(currentFilter);
                currentFilter = [condition[i]];
            } else {
                currentFilter.push(condition[i]);
            }
        }
    }

    render(data, component) {
        let isValid = false,
            result = '',
            value = data[this.field];

        for (let i = 0; i < this.filters.length; i++) {
            let filter = this.filters[i];

            if (filter[0] === '%') {
                value = value % filter[1];
            }
        }

        if (this.fieldFilter === 'length') {
            isValid = this.validateLength(value, this.operator, this.value);
        } else if (this.fieldFilter === undefined) {
            isValid = this.compare(value, this.operator, this.value);
        }

        if (isValid) {
            result = super.render(data, component);
        }

        return result;
    }

    validateLength(field, operator, value) {
        let length = 0;

        switch (typeof field) {
            case 'object':
                if (Array.isArray(field)) {
                    length = field.length;
                } else {
                    length = Object.keys(field);
                }
                break;
            case 'undefined':
                return false;
            default:
                debugger
                return false;
        }

        return this.compare(length, operator, value);
    }

    compare(value, operator, expected) {
        switch (operator) {
            case '>':
                return value > expected;
            case '>=':
                return value >= expected;
            case '==':
                return value == expected;
            case '<=':
                return value <= expected;
            case '<':
                return value < expected;
            default:
                debugger;
                return false;
        }
    }
}

class TemplateEngine
{
    constructor() {
        this.templates = [];
    }

    addTemplate(name, template) {
        this.templates[name] = template;
    }

    getTemplate(name) {
        return this.templates[name] || '';
    }

    parse(text) {
        let tokens = text.match(/\{\{.*?\}}|.+?(?=\{{|$)/g),
            innerStruct = this.buildInnerStruct(tokens),
            template = new Template(innerStruct);

        return template;
    }

    buildInnerStruct(tokens) {
        let length = tokens.length,
            isControlStart = false,
            isControlEnd = false,
            innerStructTokens = [],
            innerStruct = [],
            j = -1;

        for (let i = 0; i < length; i++) {
            if (typeof tokens[i] === "object") {
                innerStruct.push(tokens[i]);
                continue;
            }

            isControlStart = tokens[i].match(/{{#(.*)}}/) !== null;
            isControlEnd = tokens[i].match(/{{\/(.*)}}/) !== null;

            if (isControlStart) {
                innerStructTokens.push([tokens[i]]);
                j++;
            } else if (isControlEnd) {
                let currentStructTokens = innerStructTokens.pop(),
                    firstToken = currentStructTokens.shift();

                let currentInnerStruct = this.buildInnerStruct(currentStructTokens),
                    currentStruct = this.buildStruct(firstToken, currentInnerStruct);

                j--;

                if (j === -1) {
                    innerStruct.push(currentStruct);
                } else {
                    innerStructTokens[j].push(currentStruct);
                }
            } else if (j === -1) {
                innerStruct.push(tokens[i]);
            } else {
                innerStructTokens[j].push(tokens[i]);
            }
        }

        return innerStruct;
    }

    buildStruct(typeDef, innerStruct) {
        let tokens = typeDef.match(/{{#(.*)}}/)[1].trim().split(' '),
            type = tokens.shift().toLowerCase();

        switch (type) {
            case 'if':
                return new TemplateCondition(tokens, innerStruct);
            case 'loop':
                return new TemplateLoop(tokens.pop(), innerStruct);
            default:
                debugger;
                break;
        }
    }
}
