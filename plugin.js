var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typedoc/dist/lib/models/reflections", "typedoc/dist/lib/converter/components", "typedoc/dist/lib/converter/converter", "typedoc/dist/lib/converter/plugins/CommentPlugin", "typedoc/dist/lib/utils/options", "./getRawComment"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var reflections_1 = require("typedoc/dist/lib/models/reflections");
    var components_1 = require("typedoc/dist/lib/converter/components");
    var converter_1 = require("typedoc/dist/lib/converter/converter");
    var CommentPlugin_1 = require("typedoc/dist/lib/converter/plugins/CommentPlugin");
    var options_1 = require("typedoc/dist/lib/utils/options");
    var getRawComment_1 = require("./getRawComment");
    /**
     * This plugin allows you to specify if a symbol is internal or external.
     *
     * Add @internal or @external to the docs for a symbol.
     *
     * #### Example:
     * ```
     * &#47;**
     *  * @internal
     *  *&#47;
     * let foo = "123
     *
     * &#47;**
     *  * @external
     *  *&#47;
     * let bar = "123
     * ```
     */
    var InternalExternalPlugin = (function (_super) {
        __extends(InternalExternalPlugin, _super);
        function InternalExternalPlugin() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        InternalExternalPlugin_1 = InternalExternalPlugin;
        InternalExternalPlugin.prototype.initialize = function () {
            var options = this.application.options;
            options.read({}, options_1.OptionsReadMode.Prefetch);
            this.externals = (options.getValue('external-aliases') || "external").split(",");
            this.internals = (options.getValue('internal-aliases') || "internal").split(",");
            this.externalRegex = new RegExp("@(" + this.externals.join('|') + ")\\b");
            this.internalRegex = new RegExp("@(" + this.internals.join('|') + ")\\b");
            this.listenTo(this.owner, (_a = {},
                _a[converter_1.Converter.EVENT_CREATE_SIGNATURE] = this.onSignature,
                _a[converter_1.Converter.EVENT_CREATE_DECLARATION] = this.onDeclaration,
                _a[converter_1.Converter.EVENT_FILE_BEGIN] = this.onFileBegin,
                _a));
            var _a;
        };
        InternalExternalPlugin.markSignatureAndMethod = function (reflection, external) {
            reflection.flags.isExternal = external;
            // if (reflection.parent && (reflection.parent.kind === ReflectionKind.Method || reflection.parent.kind === ReflectionKind.Function) {
            if (reflection.parent && (reflection.parent.kind & reflections_1.ReflectionKind.FunctionOrMethod)) {
                reflection.parent.flags.isExternal = external;
            }
        };
        /**
         * Triggered when the converter has created a declaration reflection.
         *
         * @param context  The context object describing the current state the converter is in.
         * @param reflection  The reflection that is currently processed.
         * @param node  The node that is currently processed if available.
         */
        InternalExternalPlugin.prototype.onSignature = function (context, reflection, node) {
            if (!reflection.comment)
                return;
            // Look for @internal or @external
            var comment = reflection.comment;
            if (this.internals.some(function (tag) { return comment.hasTag(tag); })) {
                InternalExternalPlugin_1.markSignatureAndMethod(reflection, false);
            }
            else if (this.externals.some(function (tag) { return comment.hasTag(tag); })) {
                InternalExternalPlugin_1.markSignatureAndMethod(reflection, true);
            }
            this.internals.forEach(function (tag) { return CommentPlugin_1.CommentPlugin.removeTags(comment, tag); });
            this.externals.forEach(function (tag) { return CommentPlugin_1.CommentPlugin.removeTags(comment, tag); });
        };
        /**
         * Triggered when the converter has created a declaration reflection.
         *
         * @param context  The context object describing the current state the converter is in.
         * @param reflection  The reflection that is currently processed.
         * @param node  The node that is currently processed if available.
         */
        InternalExternalPlugin.prototype.onDeclaration = function (context, reflection, node) {
            if (!reflection.comment)
                return;
            // Look for @internal or @external
            var comment = reflection.comment;
            if (this.internals.some(function (tag) { return comment.hasTag(tag); })) {
                reflection.flags.isExternal = false;
            }
            else if (this.externals.some(function (tag) { return comment.hasTag(tag); })) {
                reflection.flags.isExternal = true;
            }
            this.internals.forEach(function (tag) { return CommentPlugin_1.CommentPlugin.removeTags(comment, tag); });
            this.externals.forEach(function (tag) { return CommentPlugin_1.CommentPlugin.removeTags(comment, tag); });
        };
        /**
         * Triggered when the converter has started loading a file.
         *
         * This sets the file's context `isExternal` value if an annotation is found.
         * All symbols inside the file default to the file's `isExternal` value.
         *
         * The onFileBegin event is used because once the Declaration (which represents
         * the file) has been created, it's too late to update the context.
         * The declaration will also be processed during `onDeclaration` where the tags
         * will be removed from the comment.
         *
         * @param context  The context object describing the current state the converter is in.
         * @param reflection  The reflection that is currently processed.
         * @param node  The node that is currently processed if available.
         */
        InternalExternalPlugin.prototype.onFileBegin = function (context, reflection, node) {
            if (!node)
                return;
            // Look for @internal or @external
            var comment = getRawComment_1.default(node);
            var internalMatch = this.internalRegex.exec(comment);
            var externalMatch = this.externalRegex.exec(comment);
            if (internalMatch) {
                context.isExternal = false;
            }
            else if (externalMatch) {
                context.isExternal = true;
            }
        };
        InternalExternalPlugin = InternalExternalPlugin_1 = __decorate([
            components_1.Component({ name: 'internal-external' })
        ], InternalExternalPlugin);
        return InternalExternalPlugin;
        var InternalExternalPlugin_1;
    }(components_1.ConverterComponent));
    exports.InternalExternalPlugin = InternalExternalPlugin;
});
