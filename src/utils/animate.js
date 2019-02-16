import AnimationTimer from 'animation-util'

/**
 * 设置一个帧动画
 * 返回 0 结束动画
 * 返回 1 中断动画
 */
export default function(animation, callback) {
  let { from, to, duration, easing = 'easeOutSine', bezierArgs } =
    animation || {}
  let timer = null
  let broken = false
  let doneState = ''
  let doneCallback = []
  let currValue

  duration = +duration
  from = +from
  to = +to
  if (!isNaN(from) && !isNaN(to) && typeof callback === 'function') {
    if (from === to || isNaN(duration) || duration === 0) {
      callback(to)
    } else {
      timer = new AnimationTimer({
        duration,
        easing,
        bezierArgs,
        onStart() {
          const state = callback((currValue = from), 'start')

          if (state === 0 || (broken = state === 1)) {
            timer.stop()
          }
        },
        onRun(event) {
          const state = callback(
            (currValue = from + (to - from) * event.percent),
            'running'
          )

          if (state === 0 || (broken = state === 1)) {
            timer.stop()
          }
        },
        onEnd() {
          doneState = broken ? 'broken' : 'done'
          currValue = broken ? currValue : to
          if (doneCallback.length) {
            while ((callback = doneCallback.shift())) {
              callback(currValue, doneState)
            }
          } else if (!broken) {
            callback(currValue, doneState)
          }
        },
      })
      //
      timer.run()
    }
  } else {
    doneState = 'invalid'
  }
  const inst = {
    isDone() {
      return !!doneState
    },
    getDoneState() {
      return doneState
    },
    stop() {
      if (!doneState && timer) {
        timer.stop()
      }

      return inst
    },
    break() {
      if (!doneState && timer) {
        broken = true
        timer.stop()
      }

      return inst
    },
    done(callback) {
      if (typeof callback === 'function') {
        if (doneState) {
          callback(currValue, doneState)
        } else {
          doneCallback.push(callback)
        }
      }

      return inst
    },
  }

  return inst
}
