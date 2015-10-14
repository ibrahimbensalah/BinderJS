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
        var name: string = this.dom.name;
        if (!name.match(/^on/i))
            this.dom.nodeValue = this.render();
        else {
            var eventName = name.substring(2);
            var owner = this.dom.ownerElement;
            if (!!owner) {
                owner.removeAttribute(name);
                owner.addEventListener(eventName, () => {
                    for (var i = 0; i < this.bindings.length; i++) {
                        var binding = this.bindings[i];
                    }
                });
            }
        }
    }
}

export class DomTest extends DomElement {
    bindings: Binding[] = [];

    update() {
    }
}

export class Binding {
    public children = new Map<Binding>();
    public elements: DomElement[] = [];
    public value = null;

    constructor(public parent: Binding, public accessor: Function, public scope: any) {
    }

    invalidate() {
        for (var i = 0; i < this.elements.length; i++) {
            var elt = this.elements[i];
            elt.isDirty = true;
        }
    }
}

export class Binder {
    private rootBinding: Binding = new Binding(null, (m) => m, []);
    elements: DomElement[] = [];
    observe: Function = (<any>Object).observe;

    constructor(public templateEngine: engine.TemplateEngine = new engine.TemplateEngine()) {
    }

    bind(root: any) {
        root.addEventListener("click", () => {
            this.updateDom();
        });

        var domStack = [{ dom: root, scope: [] }];

        while (domStack.length > 0) {
            var current = domStack.pop();
            var dom = current.dom;
            var childScope = current.scope.slice(0);

            if (!!dom.attributes && dom.attributes["data-model"]) {
                Array.prototype.push.apply(childScope, dom.attributes["data-model"].value.split("."));
            }

            this.performConventions(childScope, dom);
            var i: number;
            for (i = 0; !!dom.attributes && i < dom.attributes.length; i++) {
                var attribute = dom.attributes[i];
                this.compileTemplate(attribute.value, childScope, tpl => new DomAttribute(attribute, tpl));
            }
            for (i = 0; i < dom.childNodes.length; i++) {
                var child = dom.childNodes[i];
                if (child.nodeType === 1) {
                    domStack.push({ dom: child, scope: childScope});
                } else if (child.nodeType === 3) {
                    this.compileTemplate(child.textContent, childScope, tpl => new DomText(child, tpl));
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
                var b = this.parseBinding(bindingScope, 0);
                b.elements.push(domElement);
                return b;
            });
            this.elements.push(domElement);
        }
    }

    performConventions(scope: string[], dom: any) {
        if (dom.tagName === "INPUT" && dom.attributes["data-name"]) {
            var name = dom.attributes["data-name"].value;
            if (!dom.value) {
                var valueAttribute = document.createAttribute("value");
                valueAttribute.value = "{{" + name + "}}";
                dom.setAttributeNode(valueAttribute);
            }
            dom.addEventListener("change", event => {
                var path = scope.concat(name.split("."));
                this.update(path, event.target.value);
                this.updateDom();
            });
        }
    }

    updateBinding(binding: Binding, model: any) {
        var bindingStack = [{ binding: binding, model: model }];
        while (bindingStack.length) {
            var item = bindingStack.pop();
            
            var newValue = (!!item.model) ? item.binding.accessor(item.model) : null;
            if (newValue === undefined) {
                this.observe(item.model, this.updateBinding.bind(this, item.binding, item.model), ['add']);
            }
            else if (item.binding.value !== newValue) {
                item.binding.value = newValue;
                item.binding.invalidate();
                if (!!newValue && typeof newValue === "object") {
                    this.observe(newValue, this.dispatch.bind(this, item.binding), ['update']);
                }

                for (var i = 0; i < item.binding.children.length; i++) {
                    var childBinding = item.binding.children.elementAt(i);
                    bindingStack.push({ binding: childBinding, model: newValue });
                }
            }
        }
    }

    dispatch(binding: Binding) {
        for (var i = 0; i < binding.children.length; i++) {
            var child = binding.children.elementAt(i);
            this.updateBinding(child, binding.value);
        }
        // binding.updateChildren(binding.value);
        if (binding.parent != null) {
            this.dispatch(binding.parent);
        }
    }

    update(path: string[], model: any): Binder {

        if (!path || path.length === 0) {
            this.updateBinding(this.rootBinding, model);
        } else {
            var children = this.rootBinding.children;

            for (var e = 0; e < path.length; e++) {
                var b = children.get(path[e]);
                if (!!b) {
                    if ((e + 1) === path.length) {
                        this.updateBinding(b, model);
                        break;
                    }
                    children = b.children;
                } else {
                    break;
                }
            }
        }

        return this;
    }

    /**
     * @returns number of affected records
     */
    updateDom(): number {
        var count = 0;
        for (var i = 0; i < this.elements.length; i++) {
            var elt = this.elements[i];
            if (elt.isDirty) {
                elt.update();
                elt.isDirty = false;
                count++;
            }
        }
        // console.log('affected dom elements ', count);

        return count;
    }

    parseBinding(path: string[], offset: number, parent: Binding = this.rootBinding): Binding {
        var bindingExpr = path[offset];
        var targetBinding = parent.children.get(bindingExpr);
        if (!!targetBinding) {
            if ((offset + 1) < path.length)
                return this.parseBinding(path, offset + 1, targetBinding);
            else
                return targetBinding;
        }

        var i = offset;
        while (i < path.length) {
            bindingExpr = path[i];
            var child = new Binding(parent, this.createAccessor(bindingExpr), path.slice(0, i));
            parent.children.add(bindingExpr, child);
            parent = child;
            i++;
        }

        return parent;
    }

    createAccessor(expression: string): Function {
        if (expression == "[]")
            return new Function("model", "return model;");
        if (expression == "updateCell")
            return new Function("model", "return model['" + expression + "'].bind(model);");
        return new Function("model", "return model['" + expression + "'];" );
    }
}

export class Map<T> {
    private items = {};
    public keys: string[] = [];

    add(key: string, child: T) {
        this.items[key] = child;
        this.keys.push(key);
    }

    get(key: string): T {
        return this.items[key];
    }

    get length() {
        return this.keys.length;
    }

    elementAt(i: number): T {
        var key = this.keys[i];
        return key && this.get(key);
    }
}