import * as babel from 'babel-core';
import chai, {expect} from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';
import {readdirSync, readFileSync} from 'fs';
import {before, beforeEach, describe, it} from 'mocha';
import rewire from 'rewire';
import {spy} from 'sinon';
import plugin from '../build/index';

chai.use(chaiJestSnapshot);

const FIXTURES_PATH = 'test/fixtures';

before(() => chaiJestSnapshot.resetSnapshotRegistry());

beforeEach(function () {
  return chaiJestSnapshot.configureUsingMochaContext(this);
});

describe('Match snapshots of generated code for', () => {
  onFixtures((fixtureName, sourceCode) => {
    it(fixtureName, () => {
      let output = babel.transform(sourceCode, {
        plugins: [plugin],
      });
      expect(output.code).to.matchSnapshot();
    });
  });
});

describe('Match snapshots of traversal for', () => {
  function spyPluginModule(pluginModule) {
    let calls = [];
    let topLevelVisitor = pluginModule.__get__('topLevelVisitor');
    topLevelVisitor.MemberExpression =
        spyMemberExpression(topLevelVisitor.MemberExpression, calls, 'Top Level');
    let unchainingVisitor = pluginModule.__get__('unchainingVisitor');
    unchainingVisitor.MemberExpression.exit =
        spyMemberExpression(unchainingVisitor.MemberExpression.exit, calls, 'Second Level');
    return calls;
  }

  function spyMemberExpression(memberExpression, calls, visitorName) {
    return function _memberExpression(path) {
      let property = path.node.computed ? path.node.property.value : path.node.property.name;
      let spyPathSkip = spy(path, 'skip');
      let result = memberExpression.call(this, path);
      calls.push({
        visitorName,
        property,
        unchained: spyPathSkip.called,
      });
      return result;
    };
  }

  onFixtures((fixtureName, sourceCode) => {
    let pluginModule = rewire('../build/index');

    it(fixtureName, () => {
      let calls = spyPluginModule(pluginModule);
      babel.transform(sourceCode, {
        plugins: [pluginModule.default],
      });

      let traversalInfo = calls.map(call => `visitor: ${call.visitorName}${call.property === null
          ? ''
          : `, property: ${call.property}`}, ${call.unchained ? 'transformed' : 'unchanged'}`);
      expect(traversalInfo).to.matchSnapshot();
    });
  });
});

function onFixtures(f) {
  readdirSync(FIXTURES_PATH)
      .filter(fixtureFile => fixtureFile !== '.DS_Store')
      .forEach(fixtureFile => {
        let fixtureName = fixtureFile.replace(/-/g, ' ');
        let fixturePath = [FIXTURES_PATH, fixtureFile].join('/');
        let sourceCode = readFileSync(fixturePath);
        f(fixtureName, sourceCode);
      });
}
