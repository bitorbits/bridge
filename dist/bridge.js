var y = Object.defineProperty;
var m = (n, e, r) => e in n ? y(n, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : n[e] = r;
var i = (n, e, r) => (m(n, typeof e != "symbol" ? e + "" : e, r), r);
import { v4 as v } from "uuid";
class f {
  constructor(e) {
    i(this, "id", v());
    i(this, "name");
    i(this, "data", null);
    i(this, "type", "NONE");
    i(this, "successful", !1);
    this.name = e;
  }
}
class l extends f {
  constructor(r, t, s) {
    super(r);
    i(this, "type", "ASYNC");
    i(this, "resolve");
    i(this, "reject");
    this.resolve = t, this.reject = s;
  }
}
class c extends f {
  constructor(r, t) {
    super(r);
    i(this, "type", "LISTEN");
    i(this, "listen");
    this.listen = t;
  }
}
class h extends Error {
  constructor(e = "BridgeError", r = "") {
    super((e + " " + r).trim());
  }
}
class B extends h {
  constructor(e = "") {
    super("BridgeInactiveError", e);
  }
}
class E extends h {
  constructor(e = "") {
    super("BridgeUnavailableError", e);
  }
}
class d extends h {
  constructor(e = "") {
    super("BridgeCallRemovedError", e);
  }
}
class g extends h {
  constructor(e = "") {
    super("BridgePlugInNotReadyError", e);
  }
}
const u = {
  data: "",
  plugins: []
};
class w {
  constructor() {
    i(this, "bridgeCallMap", /* @__PURE__ */ new Map());
  }
  static async ready(e = u) {
    return window.bridge = new w(), await window.bridge.ready(e);
  }
  async ready(e = u) {
    const r = e.data ?? u.data, t = e.plugins ?? u.plugins;
    for (let a of t)
      await a.ready(this);
    const s = await this.async("Bridge.ready", r);
    return window.dispatchEvent(new CustomEvent("BridgeReady", { detail: s })), s;
  }
  send(e) {
    this.bridgeCallMap.set(e.id, e);
    const r = "native";
    if (window.hasOwnProperty(r))
      try {
        if (!window[r].process(JSON.stringify(e)))
          throw this.remove(e.id), new B(e.name);
      } catch (t) {
        throw this.remove(e.id), t;
      }
    else
      throw this.remove(e.id), new E(e.name);
  }
  remove(e, r = !0) {
    if (!r) {
      const t = this.bridgeCallMap.get(e);
      t !== void 0 && (t instanceof l ? t.reject(new d(t.name)) : t instanceof c && t.listen(null, !1, new d(t.name)));
    }
    return this.bridgeCallMap.delete(e);
  }
  clear() {
    this.bridgeCallMap.forEach((e) => {
      e instanceof l ? e.reject(new d(e.name)) : e instanceof c && e.listen(null, !1, new d(e.name));
    }), this.bridgeCallMap.clear();
  }
  canReceive(e) {
    return this.bridgeCallMap.has(e);
  }
  receive(e) {
    try {
      const r = JSON.parse(atob(e)), t = this.bridgeCallMap.get(r.id);
      return t === void 0 ? !1 : (t instanceof l ? (r.successful ? t.resolve(r.data) : t.reject(r.data), this.remove(t.id)) : t instanceof c && t.listen(r.data, r.successful, null), !0);
    } catch (r) {
      return console.error(r), !1;
    }
  }
  method(e, r) {
    return this.listen(`${e}.invoke`, (t) => {
      r(t).then((s) => {
        this.async(`${e}.return`, s);
      }).catch((s) => {
        let a = s;
        s instanceof Error && (a = s.message), this.async(`${e}.error`, a);
      });
    });
  }
  async(e, r = null) {
    return new Promise((t, s) => {
      const a = new l(e, t, s);
      a.data = r;
      try {
        this.send(a);
      } catch (o) {
        s(o);
      }
    });
  }
  listen(e, r, t = null) {
    return new Promise((s, a) => {
      const o = new c(e, r);
      o.data = t;
      try {
        this.send(o), s(o.id);
      } catch (p) {
        a(p);
      }
    });
  }
  unlisten(e) {
    return this.remove(e, !1);
  }
}
class C {
  constructor() {
    i(this, "bridge", null);
    i(this, "methodMap", /* @__PURE__ */ new Map());
  }
  async ready(e) {
    this.bridge = e;
    for (let [r, t] of this.methodMap)
      await this.bridge.method(r, t);
  }
  method(e, r) {
    this.methodMap.set(e, r);
  }
  async async(e, r = null) {
    if (this.bridge === null)
      throw new g(e);
    return this.bridge.async(e, r);
  }
  listen(e, r, t = null) {
    if (this.bridge === null)
      throw new g(e);
    return this.bridge.listen(e, r, t);
  }
  unlisten(e) {
    return this.bridge === null ? !1 : this.bridge.unlisten(e);
  }
}
export {
  w as Bridge,
  C as BridgePlugin
};
