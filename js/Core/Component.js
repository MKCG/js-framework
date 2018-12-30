/**
 * A Component is a stateless Object
 * which notify the application
 */
class Component {
    constructor() {
        this.listeners = [];
    }

    addListener(type, callback) {
        if (this.listeners[type] === undefined) {
            this.listeners[type] = [];
        }

        this.listeners[type].push(callback);
    }

    notify(type, data) {
        for (let i = 0; i < this.listeners[type].length; i++) {
            this.listeners[type][i](data);
        }
    }
}



// class Model {
//     constructor(eventManager) {
//         this.eventManager = eventManager;
//         this.dirty = false;
//         this.data = null;
//         this.diff = null;
//     }

//     triggerUpdated(changed, oldData, newData) {
//         let event = new EventModelUpdated(changed, oldData, newData, this);
//         this.eventManager.notify(event);
//     }
// }





// class EventManager {
//     notify(event) {
//         if (event instanceof EventModelUpdated) {

//         }
//     }
// }

// class EventModelUpdated {
//     constructor(changed, oldData, newData, model) {
//         this.changed = changed;
//         this.oldData = oldData;
//         this.newData = newData;
//         this.model = model;
//     }
// }
