// var _ = require('./util')
import _ from './util.js';

/**
 * Virtual-dom Element.
 * @param {String} tagName
 * @param {Object} props - Element's properties,
 *                       - using object to store key-value pair
 * @param {Array<Element|String>} - This element's children elements.
 *                                - Can be Element instance or just a piece plain text.
 */

// 用 JS 对象模拟 DOM 树
function Element (tagName, props, children) {
  
  // 如果是根节点
  if (!(this instanceof Element)) {
    // 如果传入的形式是这样
    // ('tagName', {}, child1, child2, child3)
    if (!_.isArray(children) && children != null) {
      // slice() 方法返回一个新的数组对象，这一对象是一个由 begin 和 end 决定的原数组的浅拷贝
      // 过滤掉孩子里面是空的
      children = _.slice(arguments, 2).filter(_.truthy)
    }
    return new Element(tagName, props, children)
  }

  // 如果 children 写在了 props 的位置
  if (_.isArray(props)) {
    children = props
    props = {}
  }

  // 设置这个 Element 的标签名、属性值、孩子、唯一标识的值
  this.tagName = tagName
  this.props = props || {}
  this.children = children || []
  this.key = props
    ? props.key
    : void 666

  // 计算这个节点的孩子总数
  var count = 0

  _.each(this.children, function (child, i) {
    if (child instanceof Element) {
      count += child.count
    } else {
      children[i] = '' + child
    }
    count++
  })

  this.count = count
}

/**
 * Render the hold element tree.
 * 根据 Element 渲染真实的 DOM，
 */
Element.prototype.render = function () {
  var el = document.createElement(this.tagName)
  var props = this.props

  for (var propName in props) {
    var propValue = props[propName]
    _.setAttr(el, propName, propValue)
  }

  _.each(this.children, function (child) {
    var childEl = (child instanceof Element)
      ? child.render()
      : document.createTextNode(child)
      
    el.appendChild(childEl)
  })

  return el
}

export default Element;
