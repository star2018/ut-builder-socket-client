import animate from './animate'

/**
 * 获取滚动条的位置
 */
export function getElementScrollPosition(elem) {
  const html = document.documentElement
  if (elem === html) {
    return [
      window.pageXOffset || html.scrollLeft,
      window.pageYOffset || html.scrollTop,
    ]
  }
  return [elem.scrollLeft, elem.scrollTop]
}

/**
 * 设置滚动条位置
 */
export function setElementScrollPosition(elem, { left, top }, animation) {
  const html = document.documentElement
  const scrollTarget = elem === html ? window : elem
  let leftAnimation = null
  let topAnimation = null
  let lastLeft = 0
  let lastTop = 0

  left = +left
  top = +top
  if (!isNaN(left)) {
    let scrollLeft =
      elem === html ? html.scrollLeft || window.pageXOffset : elem.scrollLeft

    if (scrollLeft !== left) {
      if (animation) {
        leftAnimation = animate(
          Object.assign(
            {
              duration: 250,
              from: scrollLeft,
              to: left,
            },
            animation
          ),
          (val) => {
            lastLeft = elem.scrollLeft = Math.floor(val)
          }
        )
      } else {
        elem.scrollLeft = left
      }
    }
  }
  if (!isNaN(top)) {
    let scrollTop =
      elem === html ? html.scrollTop || window.pageYOffset : elem.scrollTop

    if (scrollTop !== top) {
      if (animation) {
        topAnimation = animate(
          Object.assign(
            {
              duration: 250,
              from: scrollTop,
              to: top,
            },
            animation
          ),
          (val) => {
            lastTop = elem.scrollTop = Math.floor(val)
          }
        )
      } else {
        elem.scrollTop = top
      }
    }
  }
  if (leftAnimation || topAnimation) {
    const attach = () => {
      const [left, top] = getElementScrollPosition(elem)

      if (
        (leftAnimation && lastLeft !== left) ||
        (topAnimation && lastTop !== top)
      ) {
        // 用户触发的浏览器滚动，中断代码触发滚动
        leftAnimation && leftAnimation.break()
        topAnimation && topAnimation.break()
      }
    }

    const detach = () => {
      const leftDone = leftAnimation ? leftAnimation.isDone() : true
      const topDone = topAnimation ? topAnimation.isDone() : true

      if (leftDone && topDone) {
        scrollTarget.removeEventListener('scroll', attach, false)
      }
    }

    leftAnimation && leftAnimation.done(detach)
    topAnimation && topAnimation.done(detach)
    scrollTarget.addEventListener('scroll', attach, false)
  }
}

/**
 * 滚动至底部
 */
export function scrollElementToBottom(elem, animation) {
  setElementScrollPosition(
    elem,
    { top: elem.scrollHeight - elem.clientHeight },
    animation
  )
}

/**
 * 滚动至顶部
 */
export function scrollElementToTop(elem, animation) {
  setElementScrollPosition(elem, { top: 0 }, animation)
}

export default {
  getElementScrollPosition,
  setElementScrollPosition,
  scrollElementToBottom,
  scrollElementToTop,
}
