import engine = require("templateEngine");

export class DomElement {
    bindings: Binding[];
    isDirty: boolean = false;

    constructor(public dom: any, public template: any) {
    }

    getValue(): string {
        var args = this.bindings.map(b => b.value === null ? '' : b.value);
        return this.template.apply(this, args);
    }

    update() {
    }
}

export class DomText extends DomElement {
    update() {
        this.dom.textContent = this.getValue();
    }
}

export class DomAttribute extends DomElement {
    update() {
        this.dom.nodeValue = this.getValue();
    }
}

export class DomTest extends DomElement {
    bindings: Binding[] = [];

    update() {
        console.log(super.getValue());
    }
}

export class Binding {
    public children: Binding[] = [];
    public elements: DomElement[] = [];
    public value = null;

    constructor(public property: string = null) {
    }

    update(newValue: any) {
        if (this.updateValue(newValue)) {
            this.updateChildren(newValue);
        }
        else if (!newValue || !newValue.isPure) {
            this.updateChildren(newValue);
        }
    }

    updateValue(newValue: any): boolean {
        if (this.value !== newValue) {
            this.value = newValue;
            this.invalidate();
            return true;
        }
        return false;
    }

    updateChildren(newValue: any) {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.update(!!newValue ? newValue[child.property] : null);
        }
    }

    invalidate() {
        for (var i = 0; i < this.elements.length; i++) {
            var elt = this.elements[i];
            elt.isDirty = true;
        }
    }
}

export class Binder {
    private rootBinding: Binding = new Binding();
    elements: DomElement[] = [];
    root;

    constructor(public templateEngine: engine.TemplateEngine = new engine.TemplateEngine()) {
    }

    bind(root: any, model: any) {
        this.root = root;

        this.root.addEventListener("click", () => {
            this.updateDom();
        });

        var stack = [this.root];
        while (stack.length > 0) {
            var dom = stack.pop();
            this.performConventions(dom);

            for (var i = 0; i < dom.attributes.length; i++) {
                var attribute = dom.attributes[i];
                this.compileTemplate(attribute.value, tpl => new DomAttribute(attribute, tpl));
            }

            for (var i = 0; i < dom.childNodes.length; i++) {
                var child = dom.childNodes[i];
                if (child.nodeType === 1) {
                    stack.push(child);
                } else if (child.nodeType === 3) {
                    this.compileTemplate(child.textContent, tpl => new DomText(child, tpl));
                }
            }
        }
        return this;
    }

    private compileTemplate(template, factory: (tpl: any) => DomElement) {
        if (template && template.trim()) {
            var compiled: any = this.templateEngine.compile(template);
            if (compiled) {
                var domElement = factory(compiled.func);
                this.bindDom(domElement, compiled.params);
            }
        }
    }

    performConventions(dom: any) {
        if (dom.tagName === "INPUT" && dom.name) {
            //if (!dom.value) {
            //    var valueAttribute = document.createAttribute("value");
            //    valueAttribute.value = "{{" + dom.name + "}}";
            //    dom.setAttributeNode(valueAttribute);
            //}
            dom.addEventListener("change", event => {
                var path = event.target.name.split(".");
                this.set(path, event.target.value);
                this.updateDom();
            });
        }
    }

    update(model): Binder {
        this.rootBinding.updateChildren(model);
        return this;
    }

    set(path: string[], model: any): Binder {
        var children = this.rootBinding.children;

        if (!path || path.length == 0) {
            this.update(model);
        } else {
            for (var i = 0, e = 0; e < path.length && i < children.length;) {
                var b = children[i];
                if (b.property == path[e]) {
                    e++;
                    if (e == path.length) {
                        b.update(model);
                        break;
                    }
                    children = b.children;
                    i = 0;
                } else {
                    i++;
                }
            }
        }

        return this;
    }

    updateDom() {
        for (var i = 0; i < this.elements.length; i++) {
            var elt = this.elements[i];
            if (elt.isDirty) {
                elt.update();
                elt.isDirty = false;
            }
        }
    }

    parseBinding(path: string[], offset: number, target: Binding[]): Binding {
        var property = path[offset];
        for (var j = 0; j < target.length; j++) {
            if (property === target[j].property) {
                var targetBinding = target[j];
                if ((offset + 1) < path.length)
                    return this.parseBinding(path, offset + 1, targetBinding.children);
                else
                    return targetBinding;
            }
        }

        var parent: Binding = new Binding(property);
        target.push(parent);

        for (var i = offset + 1; i < path.length; i++) {
            var child = new Binding(path[i]);
            parent.children.push(child);
            parent = child;
        }

        return parent;
    }

    getValue(dom: DomElement): string {
        var args = dom.bindings.map(b => b.value);
        return dom.template.apply(this, args);
    }

    toString() {
        var s = "";
        var bindings = this.rootBinding.children;
        for (var i in bindings) {
            if (bindings.hasOwnProperty(i)) {
                s += "-" + bindings[i].toString() + "\n";
            }
        }
        return s;
    }

    bindDom(domElement: DomText, params) {
        domElement.bindings = params.map(param => {
            var b = this.parseBinding(param.split('.'), 0, this.rootBinding.children);
            b.elements.push(domElement);
            return b;
        });

        this.elements.push(domElement);
    }
}