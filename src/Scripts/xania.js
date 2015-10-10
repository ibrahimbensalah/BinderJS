var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "templateEngine"], function (require, exports, engine) {
    var DomElement = (function () {
        function DomElement(dom, template) {
            this.dom = dom;
            this.template = template;
        }
        DomElement.prototype.getValue = function () {
            var args = this.bindings.map(function (b) { return b.value; });
            return this.template.apply(this, args);
        };
        DomElement.prototype.update = function () {
        };
        return DomElement;
    })();
    exports.DomElement = DomElement;
    var DomText = (function (_super) {
        __extends(DomText, _super);
        function DomText() {
            _super.apply(this, arguments);
            this.bindings = [];
        }
        DomText.prototype.update = function () {
            this.dom.textContent = this.getValue();
        };
        return DomText;
    })(DomElement);
    exports.DomText = DomText;
    var DomAttribute = (function (_super) {
        __extends(DomAttribute, _super);
        function DomAttribute() {
            _super.apply(this, arguments);
            this.bindings = [];
        }
        DomAttribute.prototype.update = function () {
            this.dom.nodeValue = this.getValue();
        };
        return DomAttribute;
    })(DomElement);
    exports.DomAttribute = DomAttribute;
    var DomTest = (function (_super) {
        __extends(DomTest, _super);
        function DomTest() {
            _super.apply(this, arguments);
            this.bindings = [];
        }
        DomTest.prototype.update = function () {
            console.log(_super.prototype.getValue.call(this));
        };
        return DomTest;
    })(DomElement);
    exports.DomTest = DomTest;
    var Binding = (function () {
        function Binding(property) {
            this.property = property;
            this.children = [];
            this.isDirty = true;
        }
        Binding.prototype.update = function (model) {
            var i;
            var propertyValue = model && model.hasOwnProperty(this.property) ? model[this.property] : null;
            if (this.value !== propertyValue) {
                this.value = propertyValue;
                this.isDirty = true;
            }
            for (i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                child.update(propertyValue);
            }
        };
        Binding.prototype.toString = function () {
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
        };
        return Binding;
    })();
    exports.Binding = Binding;
    var Binder = (function () {
        function Binder(templateEngine) {
            if (templateEngine === void 0) { templateEngine = new engine.TemplateEngine(); }
            this.templateEngine = templateEngine;
            this.bindings = [];
            this.elements = [];
        }
        Binder.prototype.bind = function (root, model) {
            var _this = this;
            this.root = root;
            this.model = model;
            this.root.addEventListener("click", function () {
                _this.update();
            });
            var stack = [this.root];
            while (stack.length > 0) {
                var dom = stack.pop();
                this.performConventions(dom);
                Array.prototype.forEach.call(dom.attributes, function (attribute) {
                    var value = attribute.value.trim();
                    if (value) {
                        var template = _this.templateEngine.compile(attribute.value);
                        if (template) {
                        }
                    }
                });
                Array.prototype.forEach.call(dom.childNodes, function (child) {
                    if (child.nodeType === 1) {
                        stack.push(child);
                    }
                    else if (child.nodeType === 3) {
                        var textContent = child.textContent.trim();
                        if (textContent) {
                            var template = _this.templateEngine.compile(child.textContent);
                            if (template) {
                                var domElement = new DomText(child, template.func);
                                domElement.bindings = template.params.map(function (param) { return _this.parseBinding(param.split('.'), 0, _this.bindings); });
                                _this.elements.push(domElement);
                            }
                        }
                    }
                });
            }
            return this;
        };
        Binder.prototype.performConventions = function (dom) {
            var _this = this;
            if (dom.tagName === "INPUT" && dom.name) {
                //if (!dom.value) {
                //    var valueAttribute = document.createAttribute("value");
                //    valueAttribute.value = "{{" + dom.name + "}}";
                //    dom.setAttributeNode(valueAttribute);
                //}
                dom.addEventListener("change", function (event) {
                    _this.model[event.target.name] = event.target.value;
                    _this.update();
                });
            }
        };
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
        Binder.prototype.update = function () {
            console.log(this.bindings.length);
            for (var i = 0; i < this.bindings.length; i++) {
                var b = this.bindings[i];
                b.update(this.model);
            }
            for (var i = 0; i < this.elements.length; i++) {
                var elt = this.elements[i];
                elt.update();
            }
        };
        Binder.prototype.parseBinding = function (path, offset, target) {
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
            var parent = new Binding(property);
            target.push(parent);
            for (var i = offset + 1; i < path.length; i++) {
                var child = new Binding(path[i]);
                parent.children.push(child);
                parent = child;
            }
            return parent;
        };
        Binder.prototype.getValue = function (dom) {
            var args = dom.bindings.map(function (b) { return b.value; });
            return dom.template.apply(this, args);
        };
        Binder.prototype.toString = function () {
            var s = "";
            var bindings = this.bindings;
            for (var i in bindings) {
                if (bindings.hasOwnProperty(i)) {
                    s += bindings[i].toString() + "\n";
                }
            }
            return s;
        };
        return Binder;
    })();
    exports.Binder = Binder;
});
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
//# sourceMappingURL=xania.js.map