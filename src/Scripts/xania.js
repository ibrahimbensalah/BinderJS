var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "templateEngine"], function (require, exports, engine) {
    var DomElement = (function () {
        function DomElement(dom, template, bindings) {
            this.dom = dom;
            this.template = template;
            this.bindings = bindings;
            this._isdirty = false;
            this.init();
        }
        DomElement.prototype.init = function () {
            for (var i = 0; i < this.bindings.length; i++) {
                this.bindings[i].elements.push(this);
            }
        };
        DomElement.prototype.render = function () {
            var args = this.bindings.map(function (b) { return b.value === null ? '' : b.value; });
            return this.template.apply(this, args);
        };
        DomElement.prototype.update = function () {
        };
        Object.defineProperty(DomElement.prototype, "isDirty", {
            get: function () {
                return this._isdirty;
            },
            set: function (value) {
                this.update();
                this._isdirty = value;
            },
            enumerable: true,
            configurable: true
        });
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
    var DomEvent = (function (_super) {
        __extends(DomEvent, _super);
        function DomEvent() {
            _super.apply(this, arguments);
        }
        DomEvent.prototype.init = function () {
            var name = this.dom.name;
            this.eventName = name.substring(2);
        };
        DomEvent.prototype.update = function () {
            var _this = this;
            var owner = this.dom.ownerElement;
            if (!!owner) {
                owner.removeAttribute(name);
                owner.addEventListener(this.eventName, function () {
                    for (var i = 0; i < _this.bindings.length; i++) {
                        var binding = _this.bindings[i];
                    }
                });
            }
        };
        return DomEvent;
    })(DomElement);
    exports.DomEvent = DomEvent;
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
        function Binding(accessor) {
            this.accessor = accessor;
            this.children = new Map();
            this.elements = [];
            this.value = null;
        }
        Binding.prototype.addChild = function (key, binding) {
            binding.parent = this;
            this.children.add(key, binding);
        };
        Binding.prototype.getChild = function (key) {
            return this.children.get(key);
        };
        Binding.prototype.update = function (newValue) {
            if (this.value !== newValue) {
                this.value = newValue;
                this.invalidate();
                this.updateChildren();
                return true;
            }
            return false;
        };
        Binding.prototype.updateChildren = function () {
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children.elementAt(i);
                this.updateChild(child);
            }
        };
        Binding.prototype.updateChild = function (child) {
            var childValue = (!!this.value) ? child.accessor(this.value) : null;
            child.update(childValue);
        };
        Binding.prototype.dispatch = function () {
            if (this.parent != null) {
                this.parent.updateChildren();
                this.parent.dispatch();
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
    var ArrayBinding = (function (_super) {
        __extends(ArrayBinding, _super);
        function ArrayBinding() {
            _super.call(this, new Function("m", "return m;"));
            this.template = new Binding(new Function("m", "return m[0];"));
        }
        ArrayBinding.prototype.addChild = function (key, binding) {
            this.template.addChild(key, binding);
        };
        ArrayBinding.prototype.getChild = function (key) {
            return this.template.getChild(key);
        };
        ArrayBinding.prototype.update = function (model) {
            if (this.value !== model) {
                this.value = model;
                this.updateChild(this.template);
                return true;
            }
            return false;
        };
        ArrayBinding.prototype.updateChildren = function () {
            this.template.updateChildren();
        };
        ArrayBinding.prototype.dispatch = function () {
            if (this.parent != null) {
                this.parent.dispatch();
            }
        };
        return ArrayBinding;
    })(Binding);
    exports.ArrayBinding = ArrayBinding;
    var TemplateBinding = (function (_super) {
        __extends(TemplateBinding, _super);
        function TemplateBinding(binder, dom, scope) {
            _super.call(this, new Function("m", "return m;"));
            this.binder = binder;
            this.dom = dom;
            this.scope = scope;
            this.clones = [];
        }
        TemplateBinding.prototype.getChild = function (key) {
            var clone = this.clones[key];
            if (!!clone)
                return clone.rootBinding;
            return null;
        };
        TemplateBinding.prototype.update = function (model) {
            // if (this.value !== model) {
            this.value = model;
            if (!!this.value && !!this.dom.parentElement) {
                var parent = this.dom.parentElement;
                var keys = Object.keys(this.value);
                var key;
                var i;
                for (i = this.children.length; i < keys.length; i++) {
                    var clone = document.importNode(this.dom, true);
                    clone.removeAttribute("data-model");
                    var childScope = this.scope.slice(0).concat([i.toString()]);
                    this.binder.bind(clone, childScope, this);
                    parent.appendChild(clone);
                }
                this.updateChildren();
                return true;
            }
            return true;
        };
        return TemplateBinding;
    })(Binding);
    exports.TemplateBinding = TemplateBinding;
    var Binder = (function () {
        function Binder(templateEngine) {
            if (templateEngine === void 0) { templateEngine = new engine.TemplateEngine(); }
            this.templateEngine = templateEngine;
            this.rootBinding = new Binding(function (m) { return m; });
            this.elements = [];
        }
        Binder.prototype.bind = function (root, scope, rootBinding) {
            var _this = this;
            if (scope === void 0) { scope = []; }
            if (rootBinding === void 0) { rootBinding = this.rootBinding; }
            root.addEventListener("click", function () {
                _this.updateDom();
            });
            var domStack = [{ dom: root, scope: scope, binding: rootBinding }];
            while (domStack.length > 0) {
                var current = domStack.pop();
                var dom = current.dom;
                var childScope = current.scope.slice(0);
                if (!!dom.attributes && dom.attributes["data-model"]) {
                    var modelExpression = dom.attributes["data-model"].value.split(".");
                    Array.prototype.push.apply(childScope, modelExpression);
                    if (modelExpression.indexOf("[]") >= 0) {
                        var parent = this.parseBinding(current.scope, 0, rootBinding);
                        parent.addChild("[]", new TemplateBinding(this, dom, childScope));
                        continue;
                    }
                }
                this.performConventions(childScope, dom);
                var i;
                var tpl;
                for (i = 0; !!dom.attributes && i < dom.attributes.length; i++) {
                    var attribute = dom.attributes[i];
                    var name = attribute.name;
                    var typeName = !name.match(/^on/i) ? DomAttribute : DomEvent;
                    tpl = this.compileTemplate(attribute.value, childScope);
                    if (!!tpl)
                        this.elements.push(new typeName(attribute, tpl.func, tpl.bindings));
                }
                for (i = 0; i < dom.childNodes.length; i++) {
                    var child = dom.childNodes[i];
                    if (child.nodeType === 1) {
                        domStack.push({ dom: child, scope: childScope, binding: current.binding });
                    }
                    else if (child.nodeType === 3) {
                        tpl = this.compileTemplate(child.textContent, childScope);
                        if (!!tpl)
                            this.elements.push(new DomText(child, tpl.func, tpl.bindings));
                    }
                }
            }
            return this;
        };
        Binder.prototype.compileTemplate = function (template, scope) {
            var _this = this;
            var compiled = this.templateEngine.compile(template);
            if (compiled) {
                return {
                    func: compiled.func,
                    bindings: compiled.params.map(function (param) {
                        var bindingScope = scope.concat(param.split("."));
                        return _this.parseBinding(bindingScope, 0, _this.rootBinding);
                    })
                };
            }
            return null;
        };
        Binder.prototype.performConventions = function (scope, dom) {
            var _this = this;
            if (dom.tagName === "INPUT" && dom.attributes["data-name"]) {
                var name = dom.attributes["data-name"].value;
                if (!dom.value) {
                    var valueAttribute = document.createAttribute("value");
                    valueAttribute.value = "{{" + name + "}}";
                    dom.setAttributeNode(valueAttribute);
                }
                dom.addEventListener("change", function (event) {
                    var path = scope.concat(name.split("."));
                    _this.update(path, event.target.value);
                    _this.updateDom();
                });
            }
        };
        Binder.prototype.getBinding = function (path) {
            var result = this.rootBinding;
            for (var e = 0; e < path.length; e++) {
                result = result.getChild(path[e]);
                if (!result) {
                    return null;
                }
            }
            return result;
        };
        Binder.prototype.update = function (path, model) {
            var binding = this.getBinding(path);
            if (!!binding) {
                if (binding.update(model)) {
                    binding.dispatch();
                }
            }
            return this;
        };
        /**
         * @returns number of affected records
         */
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
            return count;
        };
        Binder.prototype.parseBinding = function (path, offset, parent) {
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
        };
        Binder.prototype.createAccessor = function (expression) {
            if (expression == "[]")
                return new Function("m", "return m;");
            if (expression == "updateCell")
                return new Function("model", "return model['" + expression + "'].bind(model);");
            return new Function("model", "return model['" + expression + "'];");
        };
        return Binder;
    })();
    exports.Binder = Binder;
    var Map = (function () {
        function Map() {
            this.items = {};
            this.keys = [];
        }
        Map.prototype.add = function (key, child) {
            this.items[key] = child;
            this.keys.push(key);
        };
        Map.prototype.get = function (key) {
            return this.items[key];
        };
        Object.defineProperty(Map.prototype, "length", {
            get: function () {
                return this.keys.length;
            },
            enumerable: true,
            configurable: true
        });
        Map.prototype.elementAt = function (i) {
            var key = this.keys[i];
            return key && this.get(key);
        };
        return Map;
    })();
    exports.Map = Map;
});
//# sourceMappingURL=xania.js.map