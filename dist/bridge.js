var p = Object.defineProperty;
var y = (n, e, t) => e in n ? p(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var i = (n, e, t) => (y(n, typeof e != "symbol" ? e + "" : e, t), t);
import { v4 as B } from "uuid";
class f {
  constructor(e) {
    i(this, "id", B());
    i(this, "name");
    i(this, "data", null);
    i(this, "type", "NONE");
    i(this, "successful", !1);
    this.name = e;
  }
}
class l extends f {
  constructor(t, r, s) {
    super(t);
    i(this, "type", "ASYNC");
    i(this, "resolve");
    i(this, "reject");
    this.resolve = r, this.reject = s;
  }
}
class d extends f {
  constructor(t, r) {
    super(t);
    i(this, "type", "LISTEN");
    i(this, "listen");
    this.listen = r;
  }
}
class c extends Error {
  constructor(e = "BridgeError", t = "") {
    super((e + " " + t).trim());
  }
}
class E extends c {
  constructor(e = "") {
    super("BridgeVersionError", e);
  }
}
class g extends c {
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
class w extends c {
  constructor(e = "") {
    super("BridgePlugInNotReadyError", e);
  }
}
const h = {
  data: "",
  plugins: []
};
class m {
  constructor() {
    i(this, "bridgeCallMap", /* @__PURE__ */ new Map());
    i(this, "nativeVersion", null);
  }
  static async ready(e = h) {
    return window.bridge = new m(), await window.bridge.ready(e);
  }
  static version() {
    var e;
    return (e = window.bridge) == null ? void 0 : e.version();
  }
  version() {
    return "3.0.0";
  }
  async ready(e = h) {
    const t = e.data ?? h.data, r = e.plugins ?? h.plugins;
    window.dispatchEvent(new CustomEvent("BridgeInit")), await this.async("Bridge.init", t);
    for (let a of r)
      await a.ready(this);
    const s = await this.async("Bridge.ready", t);
    return window.dispatchEvent(new CustomEvent("BridgeReady", { detail: s })), s;
  }
  send(e) {
    this.bridgeCallMap.set(e.id, e);
    const t = "native";
    if (window.hasOwnProperty(t)) {
      const r = window[t];
      try {
        try {
          this.nativeVersion === null && (this.nativeVersion = r.version());
        } catch {
          throw this.remove(e.id), new g(e.name);
        }
        if (this.version() !== this.nativeVersion)
          throw this.remove(e.id), new E(`${e.name} js(${this.version()}) native(${this.nativeVersion})`);
        if (!r.process(JSON.stringify(e)))
          throw this.remove(e.id), new g(e.name);
      } catch (s) {
        throw this.remove(e.id), s;
      }
    } else
      throw this.remove(e.id), new M(e.name);
  }
  remove(e, t = !0) {
    if (!t) {
      const r = this.bridgeCallMap.get(e);
      r !== void 0 && (r instanceof l ? r.reject(new u(r.name)) : r instanceof d && r.listen(null, !1, new u(r.name)));
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
      const t = JSON.parse(atob(e)), r = this.bridgeCallMap.get(t.id);
      return r === void 0 ? !1 : (r instanceof l ? (t.successful ? r.resolve(t.data) : r.reject(t.data), this.remove(r.id)) : r instanceof d && r.listen(t.data, t.successful, null), !0);
    } catch (t) {
      return console.error(t), !1;
    }
  }
  method(e, t) {
    return this.listen(`${e}.invoke`, (r) => {
      t(r).then((s) => {
        this.async(`${e}.return`, s);
      }).catch((s) => {
        let a = s;
        s instanceof Error && (a = s.message), this.async(`${e}.error`, a);
      });
    });
  }
  async(e, t = null) {
    return new Promise((r, s) => {
      const a = new l(e, r, s);
      a.data = t;
      try {
        this.send(a);
      } catch (o) {
        s(o);
      }
    });
  }
  listen(e, t, r = null) {
    return new Promise((s, a) => {
      const o = new d(e, t);
      o.data = r;
      try {
        this.send(o), s(o.id);
      } catch (v) {
        a(v);
      }
    });
  }
  unlisten(e) {
    return this.remove(e, !1);
  }
}
class x {
  constructor() {
    i(this, "bridge", null);
    i(this, "methodMap", /* @__PURE__ */ new Map());
  }
  async ready(e) {
    this.bridge = e;
    for (let [t, r] of this.methodMap)
      await this.bridge.method(t, r);
  }
  getName(e) {
    return `${this.constructor.name}.${e}`;
  }
  method(e, t) {
    this.methodMap.set(this.getName(e), t);
  }
  async async(e, t = null) {
    const r = this.getName(e);
    if (this.bridge === null)
      throw new w(r);
    return this.bridge.async(r, t);
  }
  listen(e, t, r = null) {
    const s = this.getName(e);
    if (this.bridge === null)
      throw new w(s);
    return this.bridge.listen(s, t, r);
  }
  unlisten(e) {
    return this.bridge === null ? !1 : this.bridge.unlisten(e);
  }
}
export {
  m as Bridge,
  x as BridgePlugin
};
