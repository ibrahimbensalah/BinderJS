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
            this.isDirty = false;
        }
        DomElement.prototype.render = function () {
            var args = this.bindings.map(function (b) { return b.value === null ? '' : b.value; });
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
        }
        DomText.prototype.update = function () {
            this.dom.textContent = this.render();
        };
        return DomText;
    })(DomElement);
    exports.DomText = DomText;
    var DomAttribute = (function (_super) {
        __extends(DomAttribute, _super);
        function DomAttribute() {
            _super.apply(this, arguments);
        }
        DomAttribute.prototype.update = function () {
            this.dom.nodeValue = this.render();
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
        };
        return DomTest;
    })(DomElement);
    exports.DomTest = DomTest;
    var Binding = (function () {
        function Binding(property) {
            if (property === void 0) { property = null; }
            this.property = property;
            this.children = [];
            this.elements = [];
            this.value = null;
        }
        Binding.prototype.update = function (newValue) {
            if (this.value === newValue) {
                return;
            }
            this.updateValue(newValue);
            this.updateChildren(newValue);
            if (!!newValue && this.children.length > 0) {
                var o = Object;
                var self = this;
                o.observe(newValue, function (changes) {
                    self.updateChildren(newValue);
                }, ["update"]);
            }
        };
        Binding.prototype.updateValue = function (newValue) {
            if (this.value !== newValue) {
                this.value = newValue;
                this.invalidate();
                return true;
            }
            return false;
        };
        Binding.prototype.updateChildren = function (newValue) {
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (!!newValue) {
                    child.update(newValue[child.property]);
                }
                else {
                    child.update(null);
                }
            }
        };
        Binding.prototype.invalidate = function () {
            for (var i = 0; i < this.elements.length; i++) {
                var elt = this.elements[i];
                elt.isDirty = true;
            }
        };
        return Binding;
    })();
    exports.Binding = Binding;
    var Binder = (function () {
        function Binder(templateEngine) {
            if (templateEngine === void 0) { templateEngine = new engine.TemplateEngine(); }
            this.templateEngine = templateEngine;
            this.rootBinding = new Binding();
            this.elements = [];
        }
        Binder.prototype.bind = function (root) {
            var _this = this;
            this.root = root;
            this.root.addEventListener("click", function () {
                _this.updateDom();
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
                    this.compileTemplate(attribute.value, scope, function (tpl) { return new DomAttribute(attribute, tpl); });
                }
                for (var i = 0; i < dom.childNodes.length; i++) {
                    var child = dom.childNodes[i];
                    if (child.nodeType === 1) {
                        domStack.push({ dom: child, scope: childScope });
                    }
                    else if (child.nodeType === 3) {
                        this.compileTemplate(child.textContent, scope, function (tpl) { return new DomText(child, tpl); });
                    }
                }
            }
            return this;
        };
        Binder.prototype.compileTemplate = function (template, scope, factory) {
            var _this = this;
            var compiled = this.templateEngine.compile(template);
            if (compiled) {
                var domElement = factory(compiled.func);
                domElement.bindings = compiled.params.map(function (param) {
                    var bindingScope = scope.concat(param.split("."));
                    var b = _this.parseBinding(bindingScope, 0, _this.rootBinding.children);
                    b.elements.push(domElement);
                    return b;
                });
                this.elements.push(domElement);
            }
        };
        Binder.prototype.performConventions = function (dom) {
            var _this = this;
            if (dom.tagName === "INPUT" && dom.name) {
                if (!dom.value) {
                    var valueAttribute = document.createAttribute("value");
                    valueAttribute.value = "{{" + dom.name + "}}";
                    dom.setAttributeNode(valueAttribute);
                }
                dom.addEventListener("change", function (event) {
                    var path = event.target.name.split(".");
                    _this.update(path, event.target.value);
                    _this.updateDom();
                });
            }
        };
        Binder.prototype.update = function (path, model) {
            if (!path || path.length == 0) {
                this.rootBinding.updateChildren(model);
            }
            else {
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
                    }
                    else {
                        i++;
                    }
                }
            }
            return this;
        };
        Binder.prototype.updateDom = function () {
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
        };
        Binder.prototype.parseBinding = function (path, offset, target) {
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
        };
        Binder.prototype.toString = function () {
            var s = "";
            var bindings = this.rootBinding.children;
            for (var i in bindings) {
                if (bindings.hasOwnProperty(i)) {
                    s += "-" + bindings[i].toString() + "\n";
                }
            }
            return s;
        };
        return Binder;
    })();
    exports.Binder = Binder;
});
//# sourceMappingURL=xania.js.map