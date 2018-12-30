class Store extends Component
{
    constructor(type) {
        super();

        this.type = type;
        this.storage = [];
    }

    getType() {
        return this.type;
    }

    add(id, data) {
        this.setById(id, data);
        this.notify('add', id, data);
    }

    update(id, data) {
        let old = this.getById(id);
        this.setById(id, data);
        this.notify('update', id, old, data);
    }

    delete(id) {
        let old = this.getById(id);
        this.deleteById(id);
        this.notify('delete', id, old);
    }

    getById(id) {
        return this.storage[id];
    }

    setById(id, data) {
        this.storage[id] = data;
    }

    deleteById(id) {
        delete this.storage[id];
    }
}

class StoreLocalStorage extends Store
{
    getById(id) {
        let data = localStorage.getItem(this.type + '.' + id);
        return JSON.parse(data);
    }

    setById(id, data) {
        localStorage.setItem(this.type + '.' + id, JSON.stringify(data));
    }

    deleteById(id) {
        localStorage.removeItem(this.type + '.' + id);
    }
}

class StoreRemote extends Store
{
    // Handle HTTP error with fallback to the previous state
}

class StoreChain extends Store
{
    constructor() {
        this.stores = [];
    }

    addStore(store) {
        this.stores.push(store);
    }

    getById(id) {
        for (let i = 0; i < this.stores.length; i++) {
            let value = this.stores[i].getById(id);

            if (value !== undefined) {
                return value;
            }
        }
    }

    setById(id, data) {
        for (let i = 0; i < this.stores.length; i++) {
            this.stores[i].setById(id, data);
        }
    }

    deleteById(id) {
        for (let i = 0; i < this.stores.length; i++) {
            this.stores[i].deleteById(id);
        }
    }
}
