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

let kernel = new Kernel();
// debugger;