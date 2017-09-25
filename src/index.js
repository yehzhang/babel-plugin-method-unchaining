import template from 'babel-template';
import * as t from 'babel-types';

const UNDEFINED = t.identifier('undefined');

const buildAssignmentStatement = template(`
  LEFT = RIGHT;
`);

let topLevelVisitor = {
  MemberExpression(path) {
    if (!path.get('object').isCallExpression()) {
      return;
    }

    let temporaryVariable = path.scope.generateUidIdentifier('a');
    path.scope.push({
      id: temporaryVariable,
    });

    path.traverse(unchainingVisitor, {
      temporaryVariable,
    });
    unchain(path, temporaryVariable);

    let referenceClearance = buildAssignmentStatement({
      LEFT: temporaryVariable,
      RIGHT: UNDEFINED,
    });
    path.getStatementParent().insertAfter(referenceClearance);

    path.skip();
  },
};

let unchainingVisitor = {
  MemberExpression: {
    exit(path) {
      if (!path.get('object').isCallExpression()) {
        return;
      }

      unchain(path, this.temporaryVariable);
      path.skip();
    }
  },
};

function unchain(path, temporaryVariable) {
  let call = t.assignmentExpression('=', temporaryVariable, path.node.object);
  path.get('object').replaceWith(temporaryVariable);
  path.insertBefore(call);
}

export default function () {
  return {
    visitor: topLevelVisitor,
  };
}
