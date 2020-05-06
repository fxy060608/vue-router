/* @flow */

// import type Router from '../index'
import {
  History
} from './base'
import {
  cleanPath
} from '../util/path'
import {
  START
} from '../util/route'
import {
  setupScroll,
  handleScroll
} from '../util/scroll'
import {
  // getStateKey,
  pushState,
  replaceState,
  supportsPushState
} from '../util/push-state'
import {
  resolveQuery,
  stringifyQuery
} from '../util/query'

export class HTML5History extends History {
  //   constructor (router: Router, base: ? string) {
  //     super(router, base)
  //     // fixed by xxxxxx
  //   }

  // fixed by xxxxxx(延迟初始化，校正 key)
  setupListeners () {
    const router = this.router
    const expectScroll = router.options.scrollBehavior
    const supportsScroll = supportsPushState && expectScroll

    if (supportsScroll) {
      setupScroll(router)
    }

    const initLocation = getLocation(this.base)
    window.addEventListener('popstate', e => {
      const current = this.current

      // Avoiding first `popstate` event dispatched in some browsers but first
      // history route not updated since async guard at the same time.
      const location = getLocation(this.base)
      if (this.current === START && location === initLocation) {
        return
      }

      // fixed by xxxxxx
      let id = e.state && e.state.id
      if (!id) {
        // TODO
        id = router.id
      }

      this.transitionTo({ // fixed by xxxxxx
        path: location,
        params: {
          __id__: id
        }
      }, route => {
        if (supportsScroll) {
          handleScroll(router, route, current, true)
        }
      })
    })
  }

  go (n: number) {
    window.history.go(n)
  }

  push (location: RawLocation, onComplete ?: Function, onAbort ?: Function) {
    if (typeof location === 'object') { // fixed by xxxxxx
      switch (location.type) {
        case 'navigateTo':
        case 'redirectTo':
        case 'reLaunch':
          this.router.id++
          break
        case 'switchTab':
          break
      }
      location.params = location.params || {}
      location.params.__id__ = this.router.id
    }

    const {
      current: fromRoute
    } = this

    this.transitionTo(location, route => {
      pushState(cleanPath(this.base + route.fullPath), location.params.__id__) // fixed by xxxxxx
      handleScroll(this.router, route, fromRoute, false)
      onComplete && onComplete(route)
    }, onAbort)
  }

  replace (location: RawLocation, onComplete ?: Function, onAbort ?: Function) {
    if (typeof location === 'object') { // fixed by xxxxxx
      switch (location.type) {
        case 'navigateTo':
        case 'redirectTo':
        case 'reLaunch':
          this.router.id++
          break
        case 'switchTab':
          break
      }
      location.params = location.params || {}
      location.params.__id__ = this.router.id
    }

    const {
      current: fromRoute
    } = this

    this.transitionTo(location, route => {
      replaceState(cleanPath(this.base + route.fullPath), location.params.__id__) // fixed by xxxxxx
      handleScroll(this.router, route, fromRoute, false)
      onComplete && onComplete(route)
    }, onAbort)
  }

  ensureURL (push ?: boolean) {
    if (getLocation(this.base) !== this.current.fullPath) {
      const current = cleanPath(this.base + this.current.fullPath)
      // fixed by xxxxxx
      const id = this.current.params.__id__
      push ? pushState(current, id) : replaceState(current, id)
    }
  }

  getCurrentLocation (): string {
    return {
      path: getLocation(this.base),
      params: { // fixed by xxxxxx
        __id__: ++this.router.id
      }
    }
  }
}

export function getLocation (base: string): string {
  let path = decodeURI(window.location.pathname)
  if (base && path.indexOf(base) === 0) {
    path = path.slice(base.length)
  }
  return (path || '/') + stringifyQuery(resolveQuery(window.location.search)) + window.location.hash
}
