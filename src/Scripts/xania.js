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
        DomElement.prototype.getValue = function () {
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
            this.dom.textContent = this.getValue();
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
            this.elements = [];
            this.value = null;
        }
        Binding.prototype.update = function (newValue) {
            if (this.updateValue(newValue)) {
                this.updateChildren(newValue);
            }
            else if (!newValue || !newValue.isPure) {
                this.updateChildren(newValue);
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
                child.update(!!newValue ? newValue[child.property] : null);
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
            this.bindings = [];
            this.elements = [];
        }
        Binder.prototype.bind = function (root, model) {
            var _this = this;
            this.root = root;
            this.root.addEventListener("click", function () {
                _this.updateDom();
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
                            var domElement = new DomAttribute(attribute, template.func);
                            _this.bindDom(domElement, template);
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
                                _this.bindDom(domElement, template);
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
                    var path = event.target.name.split(".");
                    _this.set(path, event.target.value);
                    _this.updateDom();
                });
            }
        };
        Binder.prototype.update = function (model) {
            for (var i = 0; i < this.bindings.length; i++) {
                var b = this.bindings[i];
                b.update(!!model ? model[b.property] : null);
            }
            return this;
        };
        Binder.prototype.set = function (path, model) {
            var children = this.bindings;
            var i;
            for (var i = 0, e = 0; e < path.length && i < children.length;) {
                var b = children[i];
                if (b.property == path[e]) {
                    e++;
                    if (e == path.length) {
                        b.update(model);
                        return;
                    }
                    children = b.children;
                    i = 0;
                }
                else {
                    i++;
                }
            }
            if (!path || path.length == 0) {
                this.update(model);
            }
            return this;
        };
        Binder.prototype.updateDom = function () {
            for (var i = 0; i < this.elements.length; i++) {
                var elt = this.elements[i];
                if (elt.isDirty) {
                    elt.update();
                    elt.isDirty = false;
                }
            }
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
        Binder.prototype.getValue = function (dom) {
            var args = dom.bindings.map(function (b) { return b.value; });
            return dom.template.apply(this, args);
        };
        Binder.prototype.toString = function () {
            var s = "";
            var bindings = this.bindings;
            for (var i in bindings) {
                if (bindings.hasOwnProperty(i)) {
                    s += "-" + bindings[i].toString() + "\n";
                }
            }
            return s;
        };
        Binder.prototype.bindDom = function (domElement, template) {
            var _this = this;
            domElement.bindings = template.params.map(function (param) {
                var b = _this.parseBinding(param.split('.'), 0, _this.bindings);
                b.elements.push(domElement);
                return b;
            });
            this.elements.push(domElement);
        };
        return Binder;
    })();
    exports.Binder = Binder;
});
//# sourceMappingURL=xania.js.map