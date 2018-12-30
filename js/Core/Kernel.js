class Kernel extends Component
{
    constructor() {
        super();

        this.router = new Router();
    }
}

class Router extends Component
{
    constructor() {
        super();

        this.routes = [];
    }

    addRoute(route) {
        this.routes.push(route);
    }

    searchRoute(path) {
        for (let i = 0; i < this.routes.length; i++) {
            if (this.routes[i].path === path) {
                return this.routes[i];
            }
        }

        return null;
    }
}

class Store extends Component
{
    constructor(type) {
        super();

        this.type = type;
        this.storage = [];
    }

    add(id, data) {
        this.storage[id] = data;
        this.notify('add', id, data);
    }

    update(id, data) {
        let old = this.storage[id];

        this.storage[id] = data;
        this.notify('update', id, old, data);
    }

    delete(id) {
        let old = this.storage[id];

        delete this.storage[id];
        this.notify('delete', id, old);
    }
}


class ModelOrchestrator extends Component
{
    constructor() {
        super();
        this.lockLevel = 0;
        this.queue = [];
    }

    isLocked() {
        return this.lockLevel > 0;
    }

    increaseLock() {
        this.lockLevel++;
    }

    decreaseLock() {
        this.lockLevel--;

        if (this.lockLevel === 0) {
            while (this.queue.length > 0) {
                let enqueued = this.queue.shift();
                enqueued.callback(...enqueued.params);
            }
        }
    }

    wait(callback, ...params) {
        this.queue.push({
            'callback': callback,
            'params': params
        });
    }
}


class Model extends Component
{
    constructor(store, orchestrator) {
        super();

        this.store = store;
        this.orchestrator = orchestrator;

        this.store.addListener('add', function(id, data) {
            let callback = function(id, data) {
                console.log(id, data);
            }.bind(this);

            if (this.orchestrator.isLocked()) {
                this.orchestrator.wait(callback, id, data);
            } else {
                callback(id, data);
            }
        }.bind(this));

        this.store.addListener('delete', function(id, data) {
            let callback = function(id, data) {
                console.log(id, data);
            }.bind(this);

            if (this.orchestrator.isLocked()) {
                this.orchestrator.wait(callback, id, data);
            } else {
                callback(id, data);
            }
        }.bind(this));

        this.store.addListener('update', function(id, oldData, newData) {
            let callback = function(id, oldData, newData) {
                console.log(id, oldData, newData);
            }.bind(this);

            if (this.orchestrator.isLocked()) {
                this.orchestrator.wait(callback, id, oldData, newData);
            } else {
                callback(id, oldData, newData);
            }
        }.bind(this));
    }
}




let store = new Store(),
    orchestrator = new ModelOrchestrator(),
    model = new Model(store, orchestrator);

orchestrator.increaseLock();

store.add(1, 'foo');
store.update(2, 'bar');
store.delete(3, 'baz');
store.update(1, 'hello');
store.delete(1);

orchestrator.decreaseLock();


let kernel = new Kernel();
// debugger;
