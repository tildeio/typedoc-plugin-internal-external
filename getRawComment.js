/**
 * Contains `getRawComment` copied from typedoc but adjusted to avoid
 * skipping over the only topmost jsdoc block
 *
 * @see https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/6
 * @see https://github.com/TypeStrong/typedoc/blob/master/src/lib/converter/factories/comment.ts
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typescript", "typedoc/dist/lib/ts-internal"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ts = require("typescript");
    var _ts = require("typedoc/dist/lib/ts-internal");
    function isTopmostModuleDeclaration(node) {
        if (node.nextContainer && node.nextContainer.kind === ts.SyntaxKind.ModuleDeclaration) {
            var next = node.nextContainer;
            if (node.name.end + 1 === next.name.pos) {
                return false;
            }
        }
        return true;
    }
    function getRootModuleDeclaration(node) {
        while (node.parent && node.parent.kind === ts.SyntaxKind.ModuleDeclaration) {
            var parent_1 = node.parent;
            if (node.name.pos === parent_1.name.end + 1) {
                node = parent_1;
            }
            else {
                break;
            }
        }
        return node;
    }
    function getRawComment(node) {
        if (node.parent && node.parent.kind === ts.SyntaxKind.VariableDeclarationList) {
            node = node.parent.parent;
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            if (!isTopmostModuleDeclaration(node)) {
                return null;
            }
            else {
                node = getRootModuleDeclaration(node);
            }
        }
        var sourceFile = _ts.getSourceFileOfNode(node);
        var comments = _ts.getJSDocCommentRanges(node, sourceFile.text);
        if (comments && comments.length) {
            var comment = void 0;
            if (node.kind === ts.SyntaxKind.SourceFile) {
                /**
                 * This is what typedoc uses to skip over the topmost jsdoc block.
                 * We want to parse it to look for `@module` and `@preferred` annotations
                 */
                // if (comments.length === 1) {
                //   return null;
                // }
                comment = comments[0];
            }
            else {
                comment = comments[comments.length - 1];
            }
            return sourceFile.text.substring(comment.pos, comment.end);
        }
        else {
            return null;
        }
    }
    exports.default = getRawComment;
});
