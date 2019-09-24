/* @flow */

import type Router from '../index'
import {
  History
} from './base'
import {
  cleanPath
} from '../util/path'
import {
  getLocation
} from './html5'
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

export class HashHistory extends History {
  constructor (router: Router, base: ? string, fallback: boolean) {
    super(router, base)
    // check history fallback deeplinking
    if (fallback && checkFallback(this.base)) {
      return
    }
    ensureSlash()
  }

  // this is delayed until the app mounts
  // to avoid the hashchange listener being fired too early
  setupListeners () {
    const router = this.router
    const expectScroll = router.options.scrollBehavior
    const supportsScroll = supportsPushState && expectScroll

    if (supportsScroll) {
      setupScroll(router)
    }

    window.addEventListener(supportsPushState ? 'popstate' : 'hashchange', (e) => {
      const current = this.current
      if (!ensureSlash()) {
        return
      }

      // fixed by xxxxxx
      let id = e.state && e.state.id
      if (!id) {
        // TODO
        id = router.id
      }

      this.transitionTo({
        path: getHash(),
        params: {
          __id__: id
        }
      }, route => {
        if (supportsScroll) {
          handleScroll(this.router, route, current, true)
        }
        if (!supportsPushState) {
          replaceHash(route.fullPath, route.params.__id__)
        }
      })
    })
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

    // fixed by xxxxxx
    const key = this.router.id

    this.transitionTo(location, route => {
      pushHash(route.fullPath, key)
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

    // fixed by xxxxxx
    const key = this.router.id

    this.transitionTo(location, route => {
      replaceHash(route.fullPath, key)
      handleScroll(this.router, route, fromRoute, false)
      onComplete && onComplete(route)
    }, onAbort)
  }

  go (n: number) {
    window.history.go(n)
  }

  ensureURL (push ?: boolean) {
    const current = this.current.fullPath
    if (getHash() !== current) {
      push ? pushHash(current, this.current.params.__id__) : replaceHash(current, this.current.params.__id__)
    }
  }

  getCurrentLocation () {
    return {
      path: getHash(),
      params: {
        __id__: ++this.router.id
      }
    }
  }
}

function checkFallback (base) {
  const location = getLocation(base)
  if (!/^\/#/.test(location)) {
    window.location.replace(
      cleanPath(base + '/#' + location)
    )
    return true
  }
}

function ensureSlash (): boolean {
  const path = getHash()
  if (path.charAt(0) === '/') {
    return true
  }
  replaceHash('/' + path)
  return false
}

export function getHash (): string {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  const href = window.location.href
  const index = href.indexOf('#')
  return index === -1 ? '' : decodeURI(href.slice(index + 1))
}

function getUrl (path) {
  const href = window.location.href
  const i = href.indexOf('#')
  const base = i >= 0 ? href.slice(0, i) : href
  return `${base}#${path}`
}

function pushHash (path, key) {
  if (supportsPushState) {
    pushState(getUrl(path), key)
  } else {
    window.location.hash = path
  }
}

function replaceHash (path, key) {
  if (supportsPushState) {
    replaceState(getUrl(path), key)
  } else {
    window.location.replace(getUrl(path))
  }
}
