
// const cssflat = require('../modules/flat-css');
// import { Resolver } from './resolver';
// import { ExtendedSelector, Mode } from './generator';
// import { parseSelector, SelectorAstNode, stringifySelector, traverseNode } from './parser';
// import { Stylesheet, TypedClass } from './stylesheet';
// import { Pojo } from './types';

// export class SelectorScoper {
//     constructor(private resolver: Resolver, private namespaceDivider: string) {

//     }
//     prepareSelector(sheet: Stylesheet, selector: string | ExtendedSelector, resolvedSymbols: Pojo, stack: Array<string | ExtendedSelector> = []) {
//         let rules: Pojo, aSelector: string;
//         if (typeof selector === 'string') {
//             rules = sheet.cssDefinition[selector];
//             aSelector = selector;
//             const mixins = sheet.mixinSelectors[aSelector];
//             if (mixins) {
//                 rules = { ...rules };
//                 mixins.forEach((mixin) => {
//                     const mixinFunction = resolvedSymbols[mixin.type];
//                     const cssMixin = cssflat({
//                         [aSelector]: {
//                             ...rules,
//                             ...mixinFunction(mixin.options.map((option: string) => valueTemplate(option, resolvedSymbols)))
//                         }
//                     });
//                     for (var key in cssMixin) {
//                         stack.push({ selector: key, rules: cssMixin[key] });
//                     }
//                 });
//                 return null;
//             }
//         } else {
//             rules = selector.rules;
//             aSelector = selector.selector;
//         }

//         if (selector === '@namespace') { return null; }
//         if (selector === ':vars') { return null; }
//         //don't emit empty selectors in production
//         if (this.config.mode === Mode.PROD && !hasKeys(rules)) { return null; }

//         const ast = parseSelector(aSelector);

//         //don't emit imports
//         if (isImport(ast)) { return null; }

//         const processedRules: Pojo<string> = {};
//         for (var k in rules) {
//             let value = Array.isArray(rules[k]) ? rules[k][rules[k].length - 1] : rules[k];
//             processedRules[k] = valueTemplate(value, resolvedSymbols);
//         }

//         return {
//             [this.scopeSelector(sheet, ast)]: processedRules
//         };

//     }
//     scopeSelector(sheet: Stylesheet, ast: SelectorAstNode): string {
//         let current = sheet;
//         let typedClass: string;
//         let element: string;

//         traverseNode(ast, (node) => {
//             const { name, type } = node;
//             if (type === 'selector') {
//                 current = sheet;
//                 typedClass = sheet.root;
//             } else if (type === 'class') {
//                 typedClass = name;
//                 current = this.handleClass(current, node, name);
//             } else if (type === 'element') {
//                 current = this.handleElement(current, node, name);
//             } else if (type === 'pseudo-element') {
//                 element = name;
//                 current = this.handlePseudoElement(current, node, name);
//             } else if (type === 'pseudo-class') {
//                 current = this.handlePseudoClass(current, node, name, sheet, typedClass, element);
//             } else if (type === 'nested-pseudo-class') {
//                 if (name === 'global') {
//                     node.type = 'selector';
//                     return true;
//                 }
//             }
//             /* do nothing */
//             return undefined;
//         });
//         return stringifySelector(ast);
//     }
//     handleClass(sheet: Stylesheet, node: SelectorAstNode, name: string) {
//         const next = sheet.resolve(this.resolver, name);
//         const localName = this.scope(name, sheet.namespace);
//         sheet.classes[name] = localName;
//         if (next !== sheet) {
//             //root to root
//             node.before = '.' + localName;
//             node.name = this.scope(next.root, next.namespace);
//             sheet = next;
//         } else {
//             //not type
//             node.name = localName;
//         }
//         return sheet;
//     }
//     handleElement(sheet: Stylesheet, node: SelectorAstNode, name: string) {
//         const next = sheet.resolve(this.resolver, name);
//         if (next !== sheet) {
//             //element selector root to root
//             node.before = '.' + this.scope(sheet.root, sheet.namespace) + ' ';
//             node.name = this.scope(next.root, next.namespace);
//             node.type = 'class';
//         }
//         return next;
//     }
//     handlePseudoElement(sheet: Stylesheet, node: SelectorAstNode, name: string) {
//         //TODO: only transform what is found
//         if (sheet.classes[name]) {
//             node.type = 'class';
//             node.before = ' ';
//             node.name = this.scope(name, sheet.namespace);
//         }
//         return sheet.resolve(this.resolver, name);
//     }
//     handlePseudoClass(sheet: Stylesheet, node: SelectorAstNode, name: string, sheetOrigin: Stylesheet, typedClassName: string, element: string) {
//         let current = element ? sheet : sheetOrigin;
//         let localName = element ? element : typedClassName;
//         while (current) {
//             const typedClass = current.typedClasses[localName];
//             if (hasState(typedClass, name)) {
//                 node.type = 'attribute';
//                 node.content = current.stateAttr(name);
//                 break;
//             }
//             const next = current.resolve(this.resolver, localName);
//             if (next !== current) {
//                 current = next;
//                 localName = current.root;
//             } else {
//                 break;
//             }
//         }
//         return sheet;
//     }
//     scope(name: string, namespace: string, separator: string = this.namespaceDivider) {
//         return namespace ? namespace + separator + name : name;
//     }
// }




// function hasState(typedClass: TypedClass, name: string) {
//     const states = typedClass && typedClass['-sb-states'];
//     return states ? states.indexOf(name) !== -1 : false;
// }

// function isImport(ast: SelectorAstNode): boolean {
//     const selectors = ast.nodes[0];
//     const selector = selectors && selectors.nodes[0];
//     return selector && selector.type === "pseudo-class" && selector.name === 'import';
// }

// function hasKeys(o: Pojo<any>) {
//     for (var k in o) {
//         if (o.hasOwnProperty(k)) {
//             return true;
//         }
//     }
//     return false;
// }

// function valueTemplate(value: string, data: Pojo, throwCondition = 0): string {
//     return value.replace(/value\((.*?)\)/g, function (match: string, name: string) {
//         if (throwCondition > 1) { throw new Error('Unresolvable variable: ' + name) }
//         let translatedValue = data[name];
//         if (~name.indexOf(',')) {
//             const nameParts = name.split(',');
//             const variableName = nameParts[0].trim();
//             let defaultValue = nameParts[1].trim();
//             defaultValue = data[defaultValue] || defaultValue;
//             translatedValue = data[variableName] || defaultValue;
//         }
//         const res = valueTemplate(translatedValue, data, throwCondition + 1);
//         return res !== undefined ? res : match;
//     });
// }