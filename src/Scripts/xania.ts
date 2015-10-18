import engine = require("templateEngine");

export class DomElement {
    bindings: Binding[];
    _isdirty: boolean = false;

    constructor(public dom: any, public template: any) {
    }

    render(): string {
        var args = this.bindings.map(b => b.value === null ? '' : b.value);
        return this.template.apply(this, args);
    }

    update() {
    }

    set isDirty(value: boolean) {
        this.update();
        this._isdirty = value;
    }

    get isDirty(): boolean {
        return this._isdirty;
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

export class DomEvent extends DomElement {
    public eventName: string;
    constructor(public dom: any, public template: any) {
        super(dom, template);
    }

    init() {
        var name: string = this.dom.name;
        this.eventName = name.substring(2);
    }

    update() {
        var owner = this.dom.ownerElement;
        if (!!owner) {
            owner.removeAttribute(name);
            owner.addEventListener(this.eventName, () => {
                for (var i = 0; i < this.bindings.length; i++) {
                    var binding = this.bindings[i];
                }
            });
        }
    }
}

export class DomTest extends DomElement {
    bindings: Binding[] = [];

    update() {
    }
}

export class Binding {
    private children = new Map<Binding>();
    public elements: DomElement[] = [];
    public value = null;
    public parent: Binding;

    constructor(public accessor: Function) {
    }

    addChild(key: string, binding: Binding) {
        binding.parent = this;
        this.children.add(key, binding);
    }

    getChild(key: string) {
        return this.children.get(key);
    }

    update(newValue: any): boolean {
        if (this.value !== newValue) {
            this.value = newValue;
            this.invalidate();

            this.updateChildren();
            return true;
        }
        return false;
    }

    updateChildren() {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children.elementAt(i);
            this.updateChild(child);
        }
    }

    updateChild(child: Binding) {
        var childValue = (!!this.value) ? child.accessor(this.value) : null;
        child.update(childValue);
    }

    dispatch() {
        if (this.parent != null) {
            this.parent.updateChildren();
            this.parent.dispatch();
        }
    }

    invalidate() {
        for (var i = 0; i < this.elements.length; i++) {
            var elt = this.elements[i];
            elt.isDirty = true;
        }
    }
}

export class ArrayBinding extends Binding {
    template: Binding;

    constructor() {
        super(new Function("m", "return m;"));

        this.template = new Binding(new Function("m", "return m[0];"));
    }

    addChild(key: string, binding: Binding) {
        this.template.addChild(key, binding);
    }

    getChild(key: string) {
        return this.template.getChild(key);
    }

    update(model: any): boolean {
        if (this.value !== model) {
            this.value = model;
            this.updateChild(this.template);
            return true;
        }
        return false;
    }

    updateChildren() {
        this.template.updateChildren();
    }

    dispatch() {
        if (this.parent != null) {
            this.parent.dispatch();
        }
    }

}

export class TemplateBinding extends Binding {

    private clones: Binder[] = [];

    constructor(public dom: HTMLElement, public scope: string[]) {
        super(new Function("m", "return m;"));
    }

    getChild(key: string): Binding {
        var clone = this.clones[key];
        if (!!clone)
            return clone.rootBinding;
        return null;
    }

    update(model: any): boolean {
        // if (this.value !== model) {
        this.value = model;

        if (!!this.value && !!this.dom.parentElement) {
            var parent = this.dom.parentElement;

            var keys = Object.keys(this.value);
            var key: string;
            var i: number;
            for (i = this.clones.length; i < keys.length; i++) {
                key = keys[i];
                var clone = <HTMLElement>document.importNode(this.dom, true);
                clone.removeAttribute("data-model");

                var binder = new Binder();
                this.clones.push(binder);

                binder.bind(clone);
                binder.update([], this.value[key]);

                parent.appendChild(clone);
            }

            for (i = 0; i < keys.length; i++) {
                key = keys[i];
                this.clones[i].update([], this.value[key]);
            }
        }

        return true;
        //}
        //return false;
    }
}
export class Binder {
    private rootBinding: Binding = new Binding((m) => m);
    elements: DomElement[] = [];

    constructor(public templateEngine: engine.TemplateEngine = new engine.TemplateEngine()) {
    }

    bind(root: HTMLElement) {
        root.addEventListener("click", () => {
            this.updateDom();
        });

        var domStack = [{ dom: root, scope: [], binding: this.rootBinding }];

        while (domStack.length > 0) {
            var current = domStack.pop();
            var dom = current.dom;
            var childScope = current.scope.slice(0);

            if (!!dom.attributes && dom.attributes["data-model"]) {
                var modelExpression = dom.attributes["data-model"].value.split(".");
                if (modelExpression.indexOf("[]") >= 0) {
                    var parent = this.parseBinding(current.scope, 0);
                    parent.addChild("*", new TemplateBinding(dom, modelExpression));
                    console.log(this.rootBinding);
                    continue;
                }

                Array.prototype.push.apply(childScope, modelExpression);
            }

            this.performConventions(childScope, dom);
            var i: number;
            for (i = 0; !!dom.attributes && i < dom.attributes.length; i++) {
                var attribute = dom.attributes[i];
                var name = attribute.name;
                var typeName = !name.match(/^on/i) ? DomAttribute : DomEvent;

                this.compileTemplate(attribute.value, childScope, tpl => new typeName(attribute, tpl));

            }
            for (i = 0; i < dom.childNodes.length; i++) {
                var child: Node = dom.childNodes[i];
                if (child.nodeType === 1) {
                    domStack.push({ dom: <HTMLElement>child, scope: childScope, binding: current.binding });
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

    getBinding(path: string[]): Binding {
        var result: Binding = this.rootBinding;
        for (var e = 0; e < path.length; e++) {
            result = result.getChild(path[e]);
            if (!result) {
                return null;
            }
        }
        return result;
    }

    update(path: string[], model: any): Binder {
        var binding = this.getBinding(path);
        if (!!binding) {
            if (binding.update(model)) {
                binding.dispatch();
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

        return count;
    }

    parseBinding(path: string[], offset: number, parent: Binding = this.rootBinding): Binding {
        var bindingExpr = path[offset];
        var targetBinding = parent.getChild(bindingExpr);
        if (!!targetBinding) {
            if ((offset + 1) < path.length)
                return this.parseBinding(path, offset + 1, targetBinding);
            else
                return targetBinding;
        }

        var child;
        for (var i = offset; i < path.length; i++) {
            bindingExpr = path[i];
            if (bindingExpr == "[]") {
                child = new ArrayBinding();
            }
            else
                child = new Binding(this.createAccessor(bindingExpr));

            parent.addChild(bindingExpr, child);
            parent = child;
        }

        return parent;
    }

    createAccessor(expression: string): Function {
        if (expression == "[]")
            return new Function("m", "return m;");
        if (expression == "updateCell")
            return new Function("model", "return model['" + expression + "'].bind(model);");
        return new Function("model", "return model['" + expression + "'];");
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