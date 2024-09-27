import { None, Option, Some } from "ts-features";
import { Node, Identifier, isIdentifierExpression, travel } from "nn-language";

import { DeclarationScope } from "./scope";
import { Diagnostic } from "..";

export interface Value {
  scope: DeclarationScope;
  ident: string;

  nodes: Set<Node>;
  first: Node;
}

export namespace Value {

  /**
   * Finds a value in a declaration scope.
   * 
   * @param scope the declaration scope to search in
   * @param ident the identifier to search for
   * @returns None if the value is not found, Some(Value) if it is found
   */
  export function find(scope: DeclarationScope, ident: Identifier): Option<Value> {
    return ident.value in scope.values
      ? Some(scope.values[ident.value])
      : None();
  }

  /**
   * Creates a new value object from an identifier.
   * 
   * @param scope the declaration scope to create the value in
   * @param ident the identifier to create the value from
   * @returns a new value object
   */
  export function make(scope: DeclarationScope, ident: Identifier): Value {
    return {
      scope,
      ident: ident.value,

      nodes: new Set([ident]),
      first: ident
    };
  }

  /**
   * Resolves values in a declaration scope.
   * 
   * @param scope to resolve values in
   * @param diagnostics to add errors to
   */
  export function resolve(scope: DeclarationScope, diagnostics: Diagnostic[]): void {
    scope.node.argumentList.args
      .forEach(arg =>
        scope.values[arg.ident.value] = make(scope, arg.ident)
      );

    travel(scope.node.exprs, isIdentifierExpression)
      .forEach(identExpr =>
        find(scope, identExpr.ident)
          .map_or_else<unknown>(
            () => diagnostics.push({
              message: `Using undeclared value name '${identExpr.ident.value}'.`,
              node: identExpr.ident
            }),
            value => value.nodes.add(identExpr.ident)
          )
      );
  }

}
