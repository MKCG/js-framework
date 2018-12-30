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
    constructor(orchestrator) {
        super();

        this.stores = [];
        this.orchestrator = orchestrator;
    }

    addStore(store) {
        if (this.stores.indexOf(store) > -1) {
            return;
        }

        this.stores.push(store);

        store.addListener('add', function(id, data) {
            let callback = function(id, data) {
                console.log(id, data);
            }.bind(this);

            if (this.orchestrator.isLocked()) {
                this.orchestrator.wait(callback, id, data);
            } else {
                callback(id, data);
            }
        }.bind(this));

        store.addListener('delete', function(id, data) {
            let callback = function(id, data) {
                console.log(id, data);
            }.bind(this);

            if (this.orchestrator.isLocked()) {
                this.orchestrator.wait(callback, id, data);
            } else {
                callback(id, data);
            }
        }.bind(this));

        store.addListener('update', function(id, oldData, newData) {
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
    model = new Model(orchestrator);

model.addStore(store);

orchestrator.increaseLock();

store.add(1, 'foo');
store.update(2, 'bar');
store.delete(3, 'baz');
store.update(1, 'hello');
store.delete(1);

orchestrator.decreaseLock();


let kernel = new Kernel();
// debugger;
