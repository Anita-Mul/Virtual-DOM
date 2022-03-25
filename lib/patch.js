// var _ = require('./util')
import _ from './util.js';

// 差异类型
var REPLACE = 0
var REORDER = 1
var PROPS = 2
var TEXT = 3

/**
 * 
 * @param {根节点[真实的 DOM 节点]} node 
 * @param {需要在这棵树上做出修改的数组} patches
 * 
 */
function patch (node, patches) {
  var walker = {index: 0}
  dfsWalk(node, walker, patches)
}


function dfsWalk (node, walker, patches) {
  // 当前节点对应的 patch
  var currentPatches = patches[walker.index]

  var len = node.childNodes
    ? node.childNodes.length
    : 0
  
  // 深度优先遍历
  for (var i = 0; i < len; i++) {
    var child = node.childNodes[i]
    walker.index++
    dfsWalk(child, walker, patches)
  }

  // 当父节点的孩子们都遍历完成，才开始修改父亲节点
  if (currentPatches) {
    applyPatches(node, currentPatches)
  }
}


function applyPatches (node, currentPatches) {
  _.each(currentPatches, function (currentPatch) {
    switch (currentPatch.type) {
      case REPLACE:         // 替换
        var newNode = (typeof currentPatch.node === 'string')
          ? document.createTextNode(currentPatch.node)
          : currentPatch.node.render()
        node.parentNode.replaceChild(newNode, node)
        break
      case REORDER:         // 子节点需要进行的操作：插入、删除、移动
        reorderChildren(node, currentPatch.moves)
        break
      case PROPS:           // 属性
        setProps(node, currentPatch.props)
        break
      case TEXT:            // 文本内容
        if (node.textContent) {
          node.textContent = currentPatch.content
        } else {
          // fuck ie
          node.nodeValue = currentPatch.content
        }
        break
      default:
        throw new Error('Unknown patch type ' + currentPatch.type)
    }
  })
}

function setProps (node, props) {
  for (var key in props) {
    if (props[key] === void 666) {
      node.removeAttribute(key)
    } else {
      var value = props[key]
      _.setAttr(node, key, value)
    }
  }
}

function reorderChildren (node, moves) {
  var staticNodeList = _.toArray(node.childNodes)
  var maps = {}

  // 遍历子节点，将有 key 属性的子节点加入到 maps 中
  _.each(staticNodeList, function (node) {
    if (node.nodeType === 1) {
      var key = node.getAttribute('key')
      if (key) {
        maps[key] = node
      }
    }
  })

  // 
  _.each(moves, function (move) {
    var index = move.index
    // 子节点只需要进行两种操作   增加和删除
    // 移动可以看成是删除和插入操作的结合
    if (move.type === 0) { // remove item
      if (staticNodeList[index] === node.childNodes[index]) { // maybe have been removed for inserting
        node.removeChild(node.childNodes[index])
      }
      staticNodeList.splice(index, 1)
    } else if (move.type === 1) { // insert item
      var insertNode = maps[move.item.key]
        ? maps[move.item.key].cloneNode(true) // reuse old item
        : (typeof move.item === 'object')
            ? move.item.render()
            : document.createTextNode(move.item)
      
      // 在 staticNodeList 中插入节点
      staticNodeList.splice(index, 0, insertNode)
      node.insertBefore(insertNode, node.childNodes[index] || null)
    }
  })
}

patch.REPLACE = REPLACE
patch.REORDER = REORDER
patch.PROPS = PROPS
patch.TEXT = TEXT

export default patch;
