/**
 * A view is a stateful component
 * which renders content using Template
 * and track currently rendered values
 */
class ViewComponent extends Component
{
    constructor(elementId, template, templateEngine, builder) {
        super();

        this.element = document.getElementById(elementId);
        this.templateEngine = templateEngine;
        this.template = template;
        this.builder = builder;
    }

    render(data, force) {
        if (force === false && this.mustUpdate(data) === false) {
            return;
        }

        if (this.templateCompilation === undefined) {
            this.templateCompilation = this.templateEngine.parse(this.template);
        }

        let rendered = this.templateCompilation.render(data, this);

        if (this.element) {
            this.element.innerHTML = rendered;
        } else {
            return rendered;
        }
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
        let template = this.templateEngine.getTemplate(type);

        params.push(template);
        params.push(this.templateEngine);
        params.push(this);

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
        super.render({items: data.documents});
    }
}

class DocumentCardView extends ViewComponent
{

}
