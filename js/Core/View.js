/**
 * A view is a stateful component
 * which renders content using Template
 * and track currently rendered values
 */
class ViewComponent extends Component
{
    constructor(elementId, template, templateEngine) {
        super();

        this.element = document.getElementById(elementId);
        this.templateEngine = templateEngine;
        this.template = template;
    }

    render(data, force) {
        if (force === false && this.mustUpdate(data) === false) {
            return;
        }

        if (this.templateCompilation === undefined) {
            this.templateCompilation = this.templateEngine.parse(this.template);
        }

        this.element.innerHTML = this.templateCompilation.render(data, this);
    }

    mustUpdate(data) {
        if (Array.isArray(data) && data.equals(this.rendered)) {
            return false;
        }

        return true;
    }
}

class ViewBuilder
{
    constructor(templateEngine) {
        this.templateEngine = templateEngine;
    }

    create(type, ...params) {
        params.push(this.templateEngine);
        return eval(`new ${type}(...params)`);
    }
}

class TimerView extends ViewComponent
{
    startTimer() {
        this.startTime = Date.now();
    }

    took() {
        return Date.now() - this.startTime;
    }
}

class DocumentListView extends ViewComponent
{
    render(data, force) {
        if (force === false && this.mustUpdate(data.ids) === false) {
            return;
        }

        this.rendered = data.ids;
        super.render({data: data.documents});
    }
}
