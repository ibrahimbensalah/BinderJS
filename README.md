# xania-templating

export class Binding {
    children: Binding[] = [];

    constructor(public path: string[]) {
    }

    joinChild(childPath: string[]) {
        this.children.push(new Binding(childPath));
    }

    join(otherPath: string[]): boolean {
        var commonPath = this.getCommonPath(otherPath);
        if (commonPath != null && !commonPath.length)
            return false;

        if (commonPath.length == this.path.length) {
            var childPath = otherPath.slice(commonPath.length);
            joinChild(childPath);
        } else if (commonPath.length == other.path.length) {
            this.path = this.path.slice(commonPath.length);
            other.children.push(this);
        } else {
            this.path = this.path.slice(commonPath.length);
            other.path = other.path.slice(commonPath.length);
            var parent = new Binding(commonPath);
            parent.children.push(this, other);
        }
        return true;
    }

    toString() {
        var s = this.path.join(".");
        for (var i in this.children) {
            s += "[" + this.children[i].toString() + "]\n";
        }
        return s;
    }

    getCommonPath(otherPath: string[]): string[] {
        return null;
    }
}

export class Binder {
    bindings: Binding[] = [];

    addBinding(path: string) {
        var b = new Binding(path.split('.'));
        for (var i in this.bindings) {
            var x = this.bindings[i].join(b);
        }
        this.bindings.push(b);
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

console.log(binder.toString())
