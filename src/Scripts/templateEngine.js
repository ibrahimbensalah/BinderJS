define(["require", "exports"], function (require, exports) {
    var TemplateEngine = (function () {
        function TemplateEngine() {
            this.cacheFn = {};
        }
        TemplateEngine.prototype.getValue = function (model, parts) {
            for (var i = 0; i < parts.length && !!model; i++) {
                model = model[parts[i]];
            }
            return model;
        };
        TemplateEngine.prototype.compile = function (template) {
            if (!template || !template.trim()) {
                return null;
            }
            template = template.replace(/\n/g, '\\n');
            var params = [];
            var returnExpr = template.replace(/{{([^}]+)}}/gm, function (a, b) {
                var paramIdx = params.length;
                params.push(b.trim());
                return "\" + arguments[" + paramIdx + "] + \"";
            });
            if (params.length) {
                if (!this.cacheFn[returnExpr]) {
                    this.cacheFn[returnExpr] = new Function("\nreturn \"" + returnExpr + "\"");
                }
                var func = this.cacheFn[returnExpr];
                return {
                    func: func,
                    params: params
                };
            }
            return null;
        };
        return TemplateEngine;
    })();
    exports.TemplateEngine = TemplateEngine;
});
//# sourceMappingURL=templateEngine.js.map