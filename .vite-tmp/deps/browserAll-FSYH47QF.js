import "./chunk-WIEAV2B7.js";
import {
  AccessibilitySystem,
  DOMPipe,
  EventSystem,
  FederatedContainer,
  accessibilityTarget
} from "./chunk-SIVKA2UL.js";
import "./chunk-Z67JWJAP.js";
import "./chunk-RZXYLP65.js";
import {
  Container,
  extensions
} from "./chunk-QWUNFYU3.js";
import "./chunk-6PEHRAEP.js";

// node_modules/pixi.js/lib/accessibility/init.mjs
extensions.add(AccessibilitySystem);
extensions.mixin(Container, accessibilityTarget);

// node_modules/pixi.js/lib/events/init.mjs
extensions.add(EventSystem);
extensions.mixin(Container, FederatedContainer);

// node_modules/pixi.js/lib/dom/init.mjs
extensions.add(DOMPipe);
//# sourceMappingURL=browserAll-FSYH47QF.js.map
