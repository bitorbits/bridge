var m = Object.defineProperty;
var y = (n, e, r) => e in n ? m(n, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : n[e] = r;
var i = (n, e, r) => (y(n, typeof e != "symbol" ? e + "" : e, r), r);
import { v4 as B } from "uuid";
class g {
  constructor(e) {
    i(this, "id", B());
    i(this, "name");
    i(this, "data", null);
    i(this, "type", "NONE");
    i(this, "successful", !1);
    this.name = e;
  }
}
class l extends g {
  constructor(r, t, s) {
    super(r);
    i(this, "type", "ASYNC");
    i(this, "resolve");
    i(this, "reject");
    this.resolve = t, this.reject = s;
  }
}
class d extends g {
  constructor(r, t) {
    super(r);
    i(this, "type", "LISTEN");
    i(this, "listen");
    this.listen = t;
  }
}
class c extends Error {
  constructor(e = "BridgeError", r = "") {
    super((e + " " + r).trim());
  }
}
class E extends c {
  constructor(e = "") {
    super("BridgeVersionError", e);
  }
}
class w extends c {
  constructor(e = "") {
    super("BridgeInactiveError", e);
  }
}
class M extends c {
  constructor(e = "") {
    super("BridgeUnavailableError", e);
  }
}
class u extends c {
  constructor(e = "") {
    super("BridgeCallRemovedError", e);
  }
}
class f extends c {
  constructor(e = "") {
    super("BridgePlugInNotReadyError", e);
  }
}
const h = {
  data: "",
  plugins: []
};
class v {
  constructor() {
    i(this, "bridgeCallMap", /* @__PURE__ */ new Map());
    i(this, "nativeVersion", null);
  }
  static async ready(e = h) {
    return window.bridge = new v(), await window.bridge.ready(e);
  }
  static version() {
    var e;
    return (e = window.bridge) == null ? void 0 : e.version();
  }
  version() {
    return "2.0.4";
  }
  async ready(e = h) {
    const r = e.data ?? h.data, t = e.plugins ?? h.plugins;
    window.dispatchEvent(new CustomEvent("BridgeInit")), await this.async("Bridge.init", r);
    for (let a of t)
      await a.ready(this);
    const s = await this.async("Bridge.ready", r);
    return window.dispatchEvent(new CustomEvent("BridgeReady", { detail: s })), s;
  }
  send(e) {
    this.bridgeCallMap.set(e.id, e);
    const r = "native";
    if (window.hasOwnProperty(r)) {
      const t = window[r];
      try {
        try {
          this.nativeVersion === null && (this.nativeVersion = t.version());
        } catch {
          throw this.remove(e.id), new w(e.name);
        }
        if (this.version() !== this.nativeVersion)
          throw this.remove(e.id), new E(`${e.name} js(${this.version()}) native(${this.nativeVersion})`);
        if (!t.process(JSON.stringify(e)))
          throw this.remove(e.id), new w(e.name);
      } catch (s) {
        throw this.remove(e.id), s;
      }
    } else
      throw this.remove(e.id), new M(e.name);
  }
  remove(e, r = !0) {
    if (!r) {
      const t = this.bridgeCallMap.get(e);
      t !== void 0 && (t instanceof l ? t.reject(new u(t.name)) : t instanceof d && t.listen(null, !1, new u(t.name)));
    }
    return this.bridgeCallMap.delete(e);
  }
  clear() {
    this.bridgeCallMap.forEach((e) => {
      e instanceof l ? e.reject(new u(e.name)) : e instanceof d && e.listen(null, !1, new u(e.name));
    }), this.bridgeCallMap.clear();
  }
  canReceive(e) {
    return this.bridgeCallMap.has(e);
  }
  receive(e) {
    try {
      const r = JSON.parse(atob(e)), t = this.bridgeCallMap.get(r.id);
      return t === void 0 ? !1 : (t instanceof l ? (r.successful ? t.resolve(r.data) : t.reject(r.data), this.remove(t.id)) : t instanceof d && t.listen(r.data, r.successful, null), !0);
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
      const o = new d(e, r);
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
class N {
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
      throw new f(e);
    return this.bridge.async(e, r);
  }
  listen(e, r, t = null) {
    if (this.bridge === null)
      throw new f(e);
    return this.bridge.listen(e, r, t);
  }
  unlisten(e) {
    return this.bridge === null ? !1 : this.bridge.unlisten(e);
  }
}
export {
  v as Bridge,
  N as BridgePlugin
};
