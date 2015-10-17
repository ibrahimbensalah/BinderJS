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
    var DomEvent = (function (_super) {
        __extends(DomEvent, _super);
        function DomEvent(dom, template) {
            _super.call(this, dom, template);
            this.dom = dom;
            this.template = template;
        }
        DomEvent.prototype.init = function () {
            var _this = this;
            var name = this.dom.name;
            var eventName = name.substring(2);
            var owner = this.dom.ownerElement;
            if (!!owner) {
                owner.removeAttribute(name);
                owner.addEventListener(eventName, function () {
                    for (var i = 0; i < _this.bindings.length; i++) {
                        var binding = _this.bindings[i];
                    }
                });
            }
        };
        DomEvent.prototype.update = function () {
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
        function Binding(parent, accessor, scope) {
            this.parent = parent;
            this.accessor = accessor;
            this.scope = scope;
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
        Binding.prototype.update = function (model) {
            var newValue = (!!model) ? this.accessor(model) : null;
            if (newValue === undefined) {
                Object.observe(model, this.update.bind(this, model), ['add']);
            }
            else if (this.value !== newValue) {
                this.value = newValue;
                this.invalidate();
                if (!!newValue && typeof newValue === "object") {
                    Object.observe(newValue, this.dispatch.bind(this), ['update']);
                }
                this.updateChildren();
            }
        };
        Binding.prototype.updateChildren = function () {
            for (var i = 0; i < this.children.length; i++) {
                var childBinding = this.children.elementAt(i);
                childBinding.update(this.value);
            }
        };
        Binding.prototype.dispatch = function () {
            this.updateChildren();
            if (this.parent != null) {
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
        function ArrayBinding(parent, scope) {
            _super.call(this, parent, new Function("m", "return m;"), scope);
            this.parent = parent;
            this.scope = scope;
            this.template = new Binding(this, new Function("m", "return m[0];"), ["template"]);
        }
        ArrayBinding.prototype.addChild = function (key, binding) {
            this.template.addChild(key, binding);
        };
        ArrayBinding.prototype.getChild = function (key) {
            return this.template.getChild(key);
        };
        ArrayBinding.prototype.update = function (model) {
            this.template.update(model);
        };
        ArrayBinding.prototype.dispatch = function () {
            this.template.updateChildren();
            if (this.parent != null) {
                this.parent.dispatch();
            }
        };
        return ArrayBinding;
    })(Binding);
    exports.ArrayBinding = ArrayBinding;
    var Binder = (function () {
        function Binder(templateEngine) {
            if (templateEngine === void 0) { templateEngine = new engine.TemplateEngine(); }
            this.templateEngine = templateEngine;
            this.rootBinding = new Binding(null, function (m) { return m; }, []);
            this.elements = [];
            this.observe = Object.observe;
        }
        Binder.prototype.bind = function (root) {
            var _this = this;
            root.addEventListener("click", function () {
                _this.updateDom();
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
                var i;
                for (i = 0; !!dom.attributes && i < dom.attributes.length; i++) {
                    var attribute = dom.attributes[i];
                    var name = attribute.name;
                    var typeName = !name.match(/^on/i) ? DomAttribute : DomEvent;
                    this.compileTemplate(attribute.value, childScope, function (tpl) { return new typeName(attribute, tpl); });
                }
                for (i = 0; i < dom.childNodes.length; i++) {
                    var child = dom.childNodes[i];
                    if (child.nodeType === 1) {
                        domStack.push({ dom: child, scope: childScope });
                    }
                    else if (child.nodeType === 3) {
                        this.compileTemplate(child.textContent, childScope, function (tpl) { return new DomText(child, tpl); });
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
                    var b = _this.parseBinding(bindingScope, 0);
                    b.elements.push(domElement);
                    return b;
                });
                this.elements.push(domElement);
            }
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
        Binder.prototype.update = function (path, model) {
            console.log(model);
            if (!path || path.length === 0) {
                this.rootBinding.update(model);
            }
            else {
                var children = this.rootBinding.children;
                for (var e = 0; e < path.length; e++) {
                    var b = children.get(path[e]);
                    if (!!b) {
                        if ((e + 1) === path.length) {
                            b.update(model);
                            break;
                        }
                        children = b.children;
                    }
                    else {
                        break;
                    }
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
                // if (elt.isDirty) {
                elt.update();
                elt.isDirty = false;
                count++;
            }
            return count;
        };
        Binder.prototype.parseBinding = function (path, offset, parent) {
            if (parent === void 0) { parent = this.rootBinding; }
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
                    child = new ArrayBinding(parent, path.slice(0, i));
                }
                else
                    child = new Binding(parent, this.createAccessor(bindingExpr), path.slice(0, i));
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