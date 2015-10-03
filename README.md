# xania-templating

export class Binding {
    public children: Binding[] = [];

    constructor(public property: string) {
    }

    toString() {
        if (this.children.length == 0)
            return this.property;

        var s = this.property + "[";
        for (var i in this.children) {
            s += "-" + this.children[i].toString();
        }
        return s + "]";
    }
}

export class Binder {
    bindings: Binding[] = [];

    addBinding(expression: string) {
        this.merge([this.parseBinding(expression)], this.bindings);
    }

    merge(list1: Binding[], list2: Binding[]) {
        for (var i = 0; i < list1.length; i++) {
            var x = list1[i];
            this.mergeOne(x, list2);
        }
    }

    mergeOne(x: Binding, list2: Binding[]) {
        for (var j = 0; j < list2.length; j++) {
            if (x.property === list2[j].property) {
                this.merge(x.children, list2[j].children);
                return;
            }
        }
        list2.push(x);
    }

    parseBinding(expression: string): Binding {
        var path = expression.split(".");
        var child: Binding = null;
        for (var i = path.length - 1; i >= 0; i--) {
            var parent = new Binding(path[i]);
            if (!!child) {
                parent.children.push(child);
            }
            child = parent;
        }
        return child;
    }

    toString() {
        var s = "";
        for (var i in this.bindings) {
            s += this.bindings[i].toString() + "\n";
        }
        return s;
    }
}

var binder = new Binder();
binder.addBinding("a.b");
binder.addBinding("a.b.c");
binder.addBinding("a.b.d");
binder.addBinding("a.g.h.b");

console.log(binder.toString());
