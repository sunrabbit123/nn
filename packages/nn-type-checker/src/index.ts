import { Declaration, Node } from 'nn-language';
import { checker, Vertex } from './checker';
import { FileScope, resolveNames } from './resolver';

export * from './resolver'
export * from './checker'

export interface Diagnostic {
  message: string;
  node: Node;
}

export interface CheckerContext {
  path: string;

  scope: FileScope;
  vertices: Vertex[];

  diagnostics: Diagnostic[];
}

export function check(syntaxTree: Declaration[], path: string): CheckerContext {
  const ctx: Partial<CheckerContext> = { path }

  const resolverResult = resolveNames(syntaxTree, path);
  if (resolverResult.is_err()) {
    const diagnostics = resolverResult.unwrap_err();
    return { ...ctx, diagnostics } as CheckerContext;
  }

  const scope = resolverResult.unwrap();
  ctx.scope = scope;

  const { vertices, diagnostics } = syntaxTree
    .flatMap((decl, index) => checker(decl, scope.declarations[index]))
    .reduce((prev, result) => {
      if (result.is_err()) {
        const [vertices, errors] = result.unwrap_err();
        return {
          vertices: [...prev.vertices, ...vertices],
          diagnostics: [...prev.diagnostics, ...errors],
        }
      }

      const vertices = result.unwrap();
      return { vertices: [...prev.vertices, ...vertices], diagnostics: prev.diagnostics };
    }, { vertices: [] as Vertex[], diagnostics: [] as Diagnostic[] });

  return { ...ctx, vertices, diagnostics } as CheckerContext;
}
