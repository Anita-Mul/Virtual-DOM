// var _ = require('./util')
// var patch = require('./patch')
// var listDiff = require('list-diff2')

import _ from './util.js';
import patch from './patch.js';
// import { diff as listDiff} from './list-diff2';
import listDiff from './listDiff.js';


/**
 * 深度优先遍历给每一个节点添加编号
 * 每一个节点执行的操作有 替换 属性改变 文本内容改变
 *                       孩子的一些操作，使用 listDiff 算法，孩子节点的标号从0开始
 */
function diff (oldTree, newTree) {
  var index = 0
  var patches = {}
  dfsWalk(oldTree, newTree, index, patches)
  return patches
}


function dfsWalk (oldNode, newNode, index, patches) {
  var currentPatch = []

  // Node is removed.
  if (newNode === null) {
    // Real DOM node will be removed when perform reordering, so has no needs to do anything in here
  // TextNode content replacing
  } else if (_.isString(oldNode) && _.isString(newNode)) {
    if (newNode !== oldNode) {
      currentPatch.push({ type: patch.TEXT, content: newNode })
    }
  // Nodes are the same, diff old node's props and children
  } else if (
      oldNode.tagName === newNode.tagName &&
      oldNode.key === newNode.key
    ) {
    // Diff props
    var propsPatches = diffProps(oldNode, newNode)
    if (propsPatches) {
      currentPatch.push({ type: patch.PROPS, props: propsPatches })
    }
    // Diff children. If the node has a `ignore` property, do not diff children
    if (!isIgnoreChildren(newNode)) {
      diffChildren(
        oldNode.children,
        newNode.children,
        index,
        patches,
        currentPatch
      )
    }
  // Nodes are not the same, replace the old node with new node
  } else {
    currentPatch.push({ type: patch.REPLACE, node: newNode })
  }

  if (currentPatch.length) {
    patches[index] = currentPatch
  }
}

/**
var before = [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}]
var after = [{id: 2}, {id: 3}, {id: 1}]
var diffs = diff.diff(before, after, 'id')    // [{id: 1}, {id: 2}, {id: 3}, null, null, null]

var before = [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}]
var after = [{id: 1}, {id: 2}, {id: 4}, {id: 6}]
var diffs = diff.diff(before, after, 'id')    // [{id: 1}, {id: 2}, null, {id: 4}, null, {id: 6}]

var before = ['a', 'b', 'c', 'd']
var after = ['a', 'b', 'e', 'f', 'c', 'd']
var diffs = diff.diff(before, after, function (item) { return item })   // ['a', 'b', 'c', 'd'])  返回 before

https://github.com/livoras/list-diff/blob/master/lib/diff.js
*/
function diffChildren (oldChildren, newChildren, index, patches, currentPatch) {
  var diffs = listDiff(oldChildren, newChildren, 'key')
  // 如果newChildren中的元素比oldChildren多，那么在执行 listDiff 操作的时候就全加进去了
  newChildren = diffs.children      

  if (diffs.moves.length) {
    // 这个 moves 中的下标是相对于父亲节点来说的，也就是 0 1 2 3 4 5 6 7 
    // 不是 dfs 中的下标
    var reorderPatch = { type: patch.REORDER, moves: diffs.moves }
    currentPatch.push(reorderPatch)
  }

  var leftNode = null
  var currentNodeIndex = index

  _.each(oldChildren, function (child, i) {
    var newChild = newChildren[i]
    // currentNodeIndex 是当前节点左边兄弟之左的全部兄弟总数，所以加上左边兄弟的儿子数 + 1，为当前节点左边所有兄弟包括他们的儿子总个数
    // 当前节点的下标应该从这个值开始排，深度遍历的下标
    // 为啥不设置一个全局变量，因为 dfsWalk 最后还要进行操作 patches[index] = currentPatch，如果是全局，那么这时候的index跟之前的就不一样了
    // 如果 leftNode不存在，说明是当前节点最左边那一串节点
    currentNodeIndex = (leftNode && leftNode.count)
      ? currentNodeIndex + leftNode.count + 1
      : currentNodeIndex + 1
    dfsWalk(child, newChild, currentNodeIndex, patches)
    leftNode = child
  })
}

function diffProps (oldNode, newNode) {
  var count = 0
  var oldProps = oldNode.props
  var newProps = newNode.props

  var key, value
  var propsPatches = {}

  // Find out different properties
  for (key in oldProps) {
    value = oldProps[key]
    if (newProps[key] !== value) {
      count++
      propsPatches[key] = newProps[key]
    }
  }

  // Find out new property
  for (key in newProps) {
    value = newProps[key]
    if (!oldProps.hasOwnProperty(key)) {
      count++
      propsPatches[key] = newProps[key]
    }
  }

  // If properties all are identical
  if (count === 0) {
    return null
  }

  return propsPatches
}

function isIgnoreChildren (node) {
  return (node.props && node.props.hasOwnProperty('ignore'))
}

export default diff;
