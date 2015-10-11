import engine = require("templateEngine");

export class DomElement {
    bindings: Binding[];
    isDirty: boolean = false;

    constructor(public dom: any, public template: any) {
    }

    render(): string {
        var args = this.bindings.map(b => b.value === null ? '' : b.value);
        return this.template.apply(this, args);
    }

    update() {
    }
}

export class DomText extends DomElement {
    update() {
        this.dom.textContent = this.render();
    }
}

export class DomAttribute extends DomElement {
    update() {
        this.dom.nodeValue = this.render();
    }
}

export class DomTest extends DomElement {
    bindings: Binding[] = [];

    update() {
    }
}

export class Binding {
    public children: Binding[] = [];
    public elements: DomElement[] = [];
    public value = null;

    constructor(public property: string = null) {
    }

    update(newValue: any) {
        if (this.value === newValue) {
            return;
        }
        this.updateValue(newValue);
        this.updateChildren(newValue);

        if (!!newValue && this.children.length > 0) {
            var o: any = Object;
            var self = this;
            o.observe(newValue, changes => {
                self.updateChildren(newValue);
            }, ["update"]);
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
            if (!!newValue) {
                child.update(newValue[child.property]);
            } else {
                child.update(null);
            }
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

    bind(root: any) {
        this.root = root;

        this.root.addEventListener("click", () => {
            this.updateDom();
        });

        var domStack = [{ dom: this.root, scope: [] }];

        while (domStack.length > 0) {
            var item = domStack.pop();
            var dom = item.dom;
            var scope = item.scope;
            var childScope = scope.slice(0);

            if (dom.attributes['[model]']) {
                Array.prototype.push.apply(childScope, dom.attributes['[model]'].value.split("."));
            }

            this.performConventions(dom);

            for (var i = 0; i < dom.attributes.length; i++) {
                var attribute = dom.attributes[i];
                this.compileTemplate(attribute.value, scope, tpl => new DomAttribute(attribute, tpl));
            }
            for (var i = 0; i < dom.childNodes.length; i++) {
                var child = dom.childNodes[i];
                if (child.nodeType === 1) {
                    domStack.push({ dom: child, scope: childScope});
                } else if (child.nodeType === 3) {
                    this.compileTemplate(child.textContent, scope, tpl => new DomText(child, tpl));
                }
            }
        }
        return this;
    }

    private compileTemplate(template: string, scope: string[], factory: (tpl: any) => DomElement) {
        var compiled: any = this.templateEngine.compile(template);
        if (compiled) {
            var domElement = factory(compiled.func);
            domElement.bindings = compiled.params.map(param => {
                var bindingScope = scope.concat(param.split("."));
                var b = this.parseBinding(bindingScope, 0, this.rootBinding.children);
                b.elements.push(domElement);
                return b;
            });
            this.elements.push(domElement);
        }
    }

    performConventions(dom: any) {
        if (dom.tagName === "INPUT" && dom.name) {
            if (!dom.value) {
                var valueAttribute = document.createAttribute("value");
                valueAttribute.value = "{{" + dom.name + "}}";
                dom.setAttributeNode(valueAttribute);
            }
            dom.addEventListener("change", event => {
                var path = event.target.name.split(".");
                this.update(path, event.target.value);
                this.updateDom();
            });
        }
    }

    update(path: string[], model: any): Binder {
        if (!path || path.length == 0) {
            this.rootBinding.updateChildren(model);
        } else {
            var children = this.rootBinding.children;

            for (var i = 0, e = 0; e < path.length && i < children.length;) {
                var b = children[i];
                if (b.property == path[e]) {
                    e++;
                    if (e === path.length) {
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
        var count = 0;
        for (var i = 0; i < this.elements.length; i++) {
            var elt = this.elements[i];
            if (elt.isDirty) {
                elt.update();
                elt.isDirty = false;
                count++;
            }
        }
        // if (count > 0)
           // console.log('count of dom updates', count);
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

        var parent = new Binding(property);
        target.push(parent);

        for (var i = offset + 1; i < path.length; i++) {
            var child = new Binding(path[i]);
            parent.children.push(child);
            parent = child;
        }

        return parent;
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
}