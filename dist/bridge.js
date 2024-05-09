var f = Object.defineProperty;
var g = (t, e, r) => e in t ? f(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var n = (t, e, r) => (g(t, typeof e != "symbol" ? e + "" : e, r), r);
import { v4 as v } from "uuid";
class h {
  constructor(e) {
    n(this, "id", v());
    n(this, "name");
    n(this, "data", null);
    n(this, "type", "NONE");
    n(this, "successful", !1);
    this.name = e;
  }
}
class c extends h {
  constructor(r, s, i) {
    super(r);
    n(this, "type", "ASYNC");
    n(this, "resolve");
    n(this, "reject");
    this.resolve = s, this.reject = i;
  }
}
class d extends h {
  constructor(r, s) {
    super(r);
    n(this, "type", "LISTENER");
    n(this, "listener");
    this.listener = s;
  }
}
class p extends Error {
  constructor() {
    super("BridgeInactiveError");
  }
}
class w extends Error {
  constructor() {
    super("BridgeUnavailableError");
  }
}
class o extends Error {
  constructor() {
    super("BridgeCallRemovedError");
  }
}
class E {
  constructor(e = "native") {
    n(this, "bridgeCallMap", /* @__PURE__ */ new Map());
    this.connector = e;
  }
  send(e) {
    if (this.bridgeCallMap.set(e.id, e), window.hasOwnProperty(this.connector))
      try {
        if (!window[this.connector].process(JSON.stringify(e)))
          throw this.remove(e.id), new p();
      } catch (r) {
        throw this.remove(e.id), r;
      }
    else
      throw this.remove(e.id), new w();
  }
  remove(e, r = !0) {
    if (!r) {
      const s = this.bridgeCallMap.get(e);
      s !== void 0 && (s instanceof c ? s.reject(new o()) : s instanceof d && s.listener(null, !1, new o()));
    }
    return this.bridgeCallMap.delete(e);
  }
  clear() {
    this.bridgeCallMap.forEach((e) => {
      e instanceof c ? e.reject(new o()) : e instanceof d && e.listener(null, !1, new o());
    }), this.bridgeCallMap.clear();
  }
  canReceive(e) {
    return this.bridgeCallMap.has(e);
  }
  receive(e) {
    try {
      const r = JSON.parse(atob(e)), s = this.bridgeCallMap.get(r.id);
      return s === void 0 ? !1 : (s instanceof c ? (r.successful ? s.resolve(r.data) : s.reject(r.data), this.remove(s.id)) : s instanceof d && s.listener(r.data, r.successful, null), !0);
    } catch (r) {
      return console.error(r), !1;
    }
  }
}
class y {
  constructor(e) {
    this.bridge = e;
  }
  addMethod(e, r) {
    return this.listenerCall(`${e}.invoke`, (s) => {
      r(s).then((i) => {
        this.asyncCall(`${e}.return`, i);
      }).catch((i) => {
        let a = i;
        i instanceof Error && (a = i.message), this.asyncCall(`${e}.error`, a);
      });
    });
  }
  asyncCall(e, r = null) {
    return new Promise((s, i) => {
      const a = new c(e, s, i);
      a.data = r;
      try {
        this.bridge.send(a);
      } catch (l) {
        i(l);
      }
    });
  }
  listenerCall(e, r, s = null) {
    return new Promise((i, a) => {
      const l = new d(e, r);
      l.data = s;
      try {
        this.bridge.send(l), i(l.id);
      } catch (u) {
        a(u);
      }
    });
  }
  removeCall(e) {
    return this.bridge.remove(e, !1);
  }
}
export {
  E as Bridge,
  o as BridgeCallRemovedError,
  p as BridgeInactiveError,
  y as BridgePlugin,
  w as BridgeUnavailableError
};
