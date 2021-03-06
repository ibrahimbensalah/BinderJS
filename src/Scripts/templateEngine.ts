﻿export class TemplateEngine {
    private cacheFn: any = {};

    getValue(model: any, parts: any[]) {
        for (var i = 0; i < parts.length && !!model; i++) {
            model = model[parts[i]];
        }
        return model;
    }

    compile(template) {
        if (!template || !template.trim()) {
            return null;
        }

        template = template.replace(/\n/g, '\\n');
        var params = [];
        var returnExpr = template.replace(/{{([^}]+)}}/gm, (a, b) => {
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
            }
        }
        return null;
    }
} 