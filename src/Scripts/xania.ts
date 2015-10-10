import engine = require("templateEngine");

export class DomElement {
    bindings: Binding[];

    constructor(public dom: any, public template: any) {
    }

    getValue(): string {
        var args = this.bindings.map(b => b.value);
        return this.template.apply(this, args);
    }

    update() {
        
    }
}

export class DomText extends DomElement {
    bindings: Binding[] = [];

    update() {
        this.dom.textContent = this.getValue();
    }
}

export class DomAttribute extends DomElement {
    bindings: Binding[] = [];

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
    public value;
    private isDirty: boolean = true;

    constructor(public property: string) {
    }

    update(model: any) {
        var i: number;
        var propertyValue = model && model.hasOwnProperty(this.property) ? model[this.property] : null;
        if (this.value !== propertyValue) {
            this.value = propertyValue;
            this.isDirty = true;
        }

        for (i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.update(propertyValue);
        }
    }

    toString() {
        var children = this.children;
        if (children.length === 0)
            return this.property;

        var s = this.property;
        //if (this.domElements.length)
        //    s += "(" + this.domElements.length + ")";

        s += "[";
        for (var i in children) {
            if (children.hasOwnProperty(i)) {
                s += "-" + children[i].toString();
            }
        }
        return s + "]";
    }
}

export class Binder {
    bindings: Binding[] = [];
    elements: DomElement[] = [];
    root; model;

    constructor(public templateEngine: engine.TemplateEngine = new engine.TemplateEngine()) {
    }

    bind(root: any, model: any) {
        this.root = root;
        this.model = model;

        this.root.addEventListener("click", () => {
            this.update();
        });

        var stack = [this.root];
        while (stack.length > 0) {
            var dom = stack.pop();
            this.performConventions(dom);

            Array.prototype.forEach.call(dom.attributes, attribute => {
                var value = attribute.value.trim();
                if (value) {
                    var template: any = this.templateEngine.compile(attribute.value);
                    if (template) {
                        //var domElement = new DomAttribute(attribute, template.func);
                        //domElement.bindings = template.args.map(a => this.parseBinding(a));

                        //// this.bindings = this.bindings.concat(domElement.bindings);

                        //this.elements.push(domElement);
                    }
                }
            });

            Array.prototype.forEach.call(dom.childNodes, child => {
                if (child.nodeType === 1) {
                    stack.push(child);
                } else if (child.nodeType === 3) {
                    const textContent = child.textContent.trim();
                    if (textContent) {
                        var template: any = this.templateEngine.compile(child.textContent);
                        if (template) {
                            var domElement = new DomText(child, template.func);
                            domElement.bindings = template.params.map(param => this.parseBinding(param.split('.'), 0, this.bindings));

                            this.elements.push(domElement);
                        }
                    }
                }
            });
        }
        return this;
    }

    performConventions(dom: any) {
        if (dom.tagName === "INPUT" && dom.name) {
            //if (!dom.value) {
            //    var valueAttribute = document.createAttribute("value");
            //    valueAttribute.value = "{{" + dom.name + "}}";
            //    dom.setAttributeNode(valueAttribute);
            //}
            dom.addEventListener("change", event => {
                this.model[event.target.name] = event.target.value;
                this.update();
            });
        }
    }

    //addBinding(expression: string, dom?: DomElement) {
    //    this.mergeBindings([this.parseBinding(expression)], this.bindings);
    //}

    //mergeBindings(source: Binding[], target: Binding[]) {
    //    for (var i = 0; i < source.length; i++) {
    //        var x = source[i];
    //        if (!this.mergeBinding(x, target))
    //            target.push(x);
    //    }
    //}

    //mergeBinding(x: Binding, target: Binding[]): boolean {
    //    for (var j = 0; j < target.length; j++) {
    //        if (x.property === target[j].property) {
    //            var targetBinding = target[j];
    //            this.mergeBindings(x.children, targetBinding.children);
    //            // targetBinding.domElements.concat(x.domElements);
    //            return true;
    //        }
    //    }
    //    return false;
    //}

    update() {
        console.log(this.bindings.length);
        for (var i = 0; i < this.bindings.length; i++) {
            var b = this.bindings[i];
            b.update(this.model);
        }

        for (var i = 0; i < this.elements.length; i++) {
            var elt = this.elements[i];
            elt.update();
        }
    }

    parseBinding(path: string[], offset: number, target: Binding[]): Binding {
        var property = path[offset];
        for (var j = 0; j < target.length; j++) {
            if (property === target[j].property) {
                var targetBinding = target[j];
                if (offset < path.length)
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
        var bindings = this.bindings;
        for (var i in bindings) {
            if (bindings.hasOwnProperty(i)) {
                s += bindings[i].toString() + "\n";
            }
        }
        return s;
    }
}

//var binder = new Binder(new engine.TemplateEngine());
//binder.addBinding("a.b", new DomTest(123, binder.templateEngine.compile("[ {{firstName}} {{lastName}} ]")));
//binder.addBinding("a.b.c", new DomTest(123, binder.templateEngine.compile("[ {{firstName}} {{lastName}} ]")));
//binder.addBinding("a.b.d");
//binder.addBinding("a.g.h.b");

//var person: any = { firstName: "ibrahim", lastName: "ben Salah" };

//var start = new Date().getTime();
//for (var e = 0; e < 744; e++) {
//    binder.update({ a: { b: person } });
//}
//var end = new Date().getTime();

//console.log(end - start);

//console.log(binder.toString()); 