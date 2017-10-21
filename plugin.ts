import { Reflection } from "typedoc/dist/lib/models/reflections/abstract";
import { ReflectionKind } from "typedoc/dist/lib/models/reflections";
import { Component, ConverterComponent } from "typedoc/dist/lib/converter/components";
import { Converter } from "typedoc/dist/lib/converter/converter";
import { Context } from "typedoc/dist/lib/converter/context";
import { CommentPlugin } from "typedoc/dist/lib/converter/plugins/CommentPlugin";
import { Options, OptionsReadMode } from "typedoc/dist/lib/utils/options";
import getRawComment from "./getRawComment";

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
@Component({name:'internal-external'})
export class InternalExternalPlugin extends ConverterComponent
{
  initialize() {
    this.listenTo(this.owner, {
      [Converter.EVENT_CREATE_SIGNATURE]:     this.onSignature,
      [Converter.EVENT_CREATE_DECLARATION]:   this.onDeclaration,
      [Converter.EVENT_FILE_BEGIN]:           this.onFileBegin,
    });
  }

  /**
   * Triggered when the converter has created a declaration reflection.
   *
   * @param context  The context object describing the current state the converter is in.
   * @param reflection  The reflection that is currently processed.
   * @param node  The node that is currently processed if available.
   */
  private onSignature(context: Context, reflection: Reflection, node?) {
    if (reflection.name === 'fooBarBaz') {
      reflection.flags.isExternal = false;
      reflection.parent.flags.isExternal = false;
      console.log("===== ON SIGNATURE =====");
      console.log(reflection.parent.toObject());
      // console.log(reflection.toStringHierarchy(), reflection.comment && reflection.comment.toObject(), reflection.parent.comment && reflection.parent.comment.toObject());
    }
    // markSignatureAndMethod(reflection, isExternal(reflection.comment));
  }

  /**
   * Triggered when the converter has created a declaration reflection.
   *
   * @param context  The context object describing the current state the converter is in.
   * @param reflection  The reflection that is currently processed.
   * @param node  The node that is currently processed if available.
   */
  private onDeclaration(context: Context, reflection: Reflection, node?) {
    reflection.flags.isExternal = isExternal(reflection.comment);
  }

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
  private onFileBegin(context: Context, reflection: Reflection, node?) {
    context.isExternal = isExternal(node && getRawComment(node))
  }
}

type Comment = string | Reflection['comment'] | undefined;

function isExternal(comment: Comment): boolean {
  if (typeof comment === 'string') {
    return comment.indexOf('@api public') === -1;
  } else if (comment && comment.hasTag('api')) {
    let { text } = comment.getTag('api');
    CommentPlugin.removeTags(comment, 'api');
    return text.trim() !== 'public';
  }

  return true;
}

function markSignatureAndMethod(reflection: Reflection, external: boolean) {
  reflection.flags.isExternal = external;
  // if (reflection.parent && (reflection.parent.kind === ReflectionKind.Method || reflection.parent.kind === ReflectionKind.Function) {
  if (reflection.parent && (reflection.parent.kind & ReflectionKind.FunctionOrMethod)) {
    if (reflection.parent.flags.isExternal === false) return;
    reflection.parent.flags.isExternal = external;
  }
}
