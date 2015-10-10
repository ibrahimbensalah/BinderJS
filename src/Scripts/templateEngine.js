define(["require", "exports"], function (require, exports) {
    var TemplateEngine = (function () {
        function TemplateEngine() {
            this.cacheFn = {};
        }
        //render(template, model) {
        //    var args = [];
        //    for (var i = 0; i < template.params.length; i++) {
        //        var arg = this.getValue(model, template.params[i]);
        //        if (typeof (arg) === "undefined" || arg === null)
        //            args.push("");
        //        else
        //            args.push(arg);
        //    }
        //    return template.func.apply(this, args);
        //}
        TemplateEngine.prototype.getValue = function (model, parts) {
            for (var i = 0; i < parts.length && !!model; i++) {
                model = model[parts[i]];
            }
            return model;
        };
        TemplateEngine.prototype.compile = function (template) {
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