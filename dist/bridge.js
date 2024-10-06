var v = Object.defineProperty;
var p = (n, e, t) => e in n ? v(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var i = (n, e, t) => p(n, typeof e != "symbol" ? e + "" : e, t);
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
class c extends f {
  constructor(t, r, s) {
    super(t);
    i(this, "type", "ASYNC");
    i(this, "resolve");
    i(this, "reject");
    this.resolve = r, this.reject = s;
  }
}
class l extends f {
  constructor(t, r) {
    super(t);
    i(this, "type", "LISTEN");
    i(this, "listen");
    this.listen = r;
  }
}
class d extends Error {
  constructor(e = "BridgeError", t = "") {
    super((e + " " + t).trim());
  }
}
class E extends d {
  constructor(e = "") {
    super("BridgeVersionError", e);
  }
}
class g extends d {
  constructor(e = "") {
    super("BridgeInactiveError", e);
  }
}
class R extends d {
  constructor(e = "") {
    super("BridgeUnavailableError", e);
  }
}
class u extends d {
  constructor(e = "") {
    super("BridgeCallRemovedError", e);
  }
}
class m extends d {
  constructor(e = "") {
    super("BridgePlugInNotReadyError", e);
  }
}
const h = {
  data: "",
  plugins: []
};
class w {
  constructor() {
    i(this, "bridgeCallMap", /* @__PURE__ */ new Map());
    i(this, "nativeVersion", null);
    i(this, "bridgeIsReady", !1);
  }
  static async ready(e = h) {
    return window.bridge = new w(), await window.bridge.ready(e);
  }
  static version() {
    var e;
    return (e = window.bridge) == null ? void 0 : e.version();
  }
  version() {
    return "4.0.5";
  }
  async ready(e = h) {
    if (this.bridgeIsReady) return null;
    const t = e.data ?? h.data, r = e.plugins ?? h.plugins;
    window.dispatchEvent(new CustomEvent("BridgeInit")), await this.async("Bridge.init", t);
    for (let a of r)
      await a.ready(this);
    const s = await this.async("Bridge.ready", t);
    return window.dispatchEvent(new CustomEvent("BridgeReady", { detail: s })), this.bridgeIsReady = !0, s;
  }
  isReady() {
    return this.bridgeIsReady;
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
      throw this.remove(e.id), new R(e.name);
  }
  remove(e, t = !0) {
    if (!t) {
      const r = this.bridgeCallMap.get(e);
      r !== void 0 && (r instanceof c ? r.reject(new u(r.name)) : r instanceof l && r.listen(null, !1, new u(r.name)));
    }
    return this.bridgeCallMap.delete(e);
  }
  clear() {
    this.bridgeCallMap.forEach((e) => {
      e instanceof c ? e.reject(new u(e.name)) : e instanceof l && e.listen(null, !1, new u(e.name));
    }), this.bridgeCallMap.clear();
  }
  canReceive(e) {
    return this.bridgeCallMap.has(e);
  }
  receive(e) {
    try {
      const t = JSON.parse(atob(e)), r = this.bridgeCallMap.get(t.id);
      return r === void 0 ? !1 : (r instanceof c ? (t.successful ? r.resolve(t.data) : r.reject(t.data), this.remove(r.id)) : r instanceof l && r.listen(t.data, t.successful, null), !0);
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
      const a = new c(e, r, s);
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
      const o = new l(e, t);
      o.data = r;
      try {
        this.send(o), s(o.id);
      } catch (y) {
        a(y);
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
    for (let [t, r] of this.methodMap)
      await this.bridge.method(t, r);
  }
  getName(e) {
    const t = this.name().trim();
    return [t === "" ? null : t, e.trim()].filter((s) => s !== null).join(".");
  }
  isReady() {
    return this.bridge !== null && this.bridge.isReady();
  }
  method(e, t) {
    this.methodMap.set(this.getName(e), t);
  }
  async async(e, t = null) {
    const r = this.getName(e);
    if (!this.isReady())
      throw new m(r);
    return this.bridge.async(r, t);
  }
  listen(e, t, r = null) {
    const s = this.getName(e);
    if (!this.isReady())
      throw new m(s);
    return this.bridge.listen(s, t, r);
  }
  unlisten(e) {
    return this.isReady() ? this.bridge.unlisten(e) : !1;
  }
}
export {
  w as Bridge,
  N as BridgePlugin
};
