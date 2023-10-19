
export default class SplitView {
  constructor() {
    this.HORIZONTAL = "horizontal";
    this.VERTICAL = "vertical";

    this.CLASS_GUTTER = "gutter";
    this.CLASS_SPLIT_VIEW = "split-view";
    this.CLASS_HORIZONTAL = "horizontal";
    this.CLASS_VERTICAL = "vertical";

    this.NOOP = () => false;

    this.dragContext = null;
    this.main = this;
  }

  parseSplitView = (element) => {
    if (!element.classList.contains(this.CLASS_SPLIT_VIEW)) {
      return null;
    }

    const direction = element.classList.contains(this.CLASS_HORIZONTAL)
      ? this.HORIZONTAL
      : element.classList.contains(this.CLASS_VERTICAL)
      ? this.VERTICAL
      : null;

    if (!direction) {
      return null;
    }

    let viewA = element.children[0];
    let gutter = element.children[1];
    let viewB = element.children[2];

    if (!viewA || !viewB) {
      return null;
    }
    if (!gutter || !gutter.classList.contains(this.CLASS_GUTTER)) {
       gutter = element.children[2];
       viewB = element.children[3];
    }
    if (!gutter || !gutter.classList.contains(this.CLASS_GUTTER)) {
      return null;
    }

    const gutterStyle = getComputedStyle(gutter);

    let clientAxis, positionAxis, dimension;

    if (direction === this.HORIZONTAL) {
      clientAxis = "clientX";
      positionAxis = "x";
      dimension = "width";
    } else {
      clientAxis = "clientY";
      positionAxis = "y";
      dimension = "height";
    }

    return {
      direction: direction,
      element: element,
      gutter: gutter,
      viewA: viewA,
      viewB: viewB,
      cursor: gutterStyle.cursor,
      clientAxis: clientAxis,
      positionAxis: positionAxis,
      dimension: dimension,
      getMousePosition: function (e) {
        if ("touches" in e) {
          return e.touches[0][this.clientAxis];
        }
        return e[this.clientAxis];
      },
    };
  };

  dragStartHandler = (e) => {
    // console.log('[dragStartHandler]', e)

    // Already dragging
    if (this.dragContext) {
      return;
    }

    // Right-clicking can't start dragging.
    if ("button" in e && e.button !== 0) {
      return;
    }

    //const gutter = this;
    const gutter = e.target;
    const splitView = this.parseSplitView(gutter.parentNode);

    if (!splitView) {
      console.warn("this gutter has no valid split view", gutter);
      return;
    }

    // Make the drag context.
    // This context is shared while dragging and at the end of the drag.
    this.dragContext = {
      splitView: splitView,
    };

    e.preventDefault();

    const { viewA, viewB } = splitView;

    if (e.type === "mousedown") {
      window.addEventListener("mousemove", this.dragHandler);
      window.addEventListener("mouseup", this.dragEndHandler);
      window.addEventListener("mouseleave", this.dragEndHandler);
    } else {
      window.addEventListener("touchmove", this.dragHandler);
      window.addEventListener("touchend", this.dragEndHandler);
      window.addEventListener("touchleave", this.dragEndHandler);
    }

    // Disable selection. Disable!
    viewA.addEventListener("selectstart", this.NOOP);
    viewA.addEventListener("dragstart", this.NOOP);
    viewB.addEventListener("selectstart", this.NOOP);
    viewB.addEventListener("dragstart", this.NOOP);

    viewA.style.userSelect = "none";
    viewA.style.webkitUserSelect = "none";
    viewA.style.MozUserSelect = "none";
    viewA.style.pointerEvents = "none";

    viewB.style.userSelect = "none";
    viewB.style.webkitUserSelect = "none";
    viewB.style.MozUserSelect = "none";
    viewB.style.pointerEvents = "none";

    document.body.style.cursor = splitView.cursor;
  };

  initsplit = (element) => {
    const splitView = this.parseSplitView(element);

    //const { splitView } = this.dragContext
    const { gutter, dimension, positionAxis, viewA, viewB } = splitView;

    const splitViewBounds = splitView.element.getBoundingClientRect();
    const gutterBounds = gutter.getBoundingClientRect();

    //const mousePosition = splitView.getMousePosition(e)

    //    let percent = (mousePosition - splitViewBounds[positionAxis]) / splitViewBounds[dimension] * 100

    // clamp 0 ~ 100
    //    percent = percent < 0 ? 0 : percent < 100 ? percent : 100

    let percent = 50;
    viewA.style[dimension] = `calc(${percent}% - ${
      gutterBounds[dimension] / 2
    }px)`;
    viewB.style[dimension] = `calc(${100 - percent}% - ${
      gutterBounds[dimension] / 2
    }px)`;

    viewA.dispatchEvent(
      new CustomEvent("splitresize", {
        bubbles: true,
        detail: {},
      }),
    );

    viewB.dispatchEvent(
      new CustomEvent("splitresize", {
        bubbles: true,
        detail: {},
      }),
    );
    
  };
  dragHandler = (e) => {
     //console.log('[dragHandler]', e)
    //e.preventDefault();
    //e.stopPropagation();

    const { splitView } = this.dragContext;
    const { gutter, dimension, positionAxis, viewA, viewB } = splitView;

    const splitViewBounds = splitView.element.getBoundingClientRect();
    const gutterBounds = gutter.getBoundingClientRect();

    const mousePosition = splitView.getMousePosition(e);

    let percent =
      ((mousePosition - splitViewBounds[positionAxis]) /
        splitViewBounds[dimension]) *
      100;

    // clamp 0 ~ 100
    percent = percent < 0 ? 0 : percent < 100 ? percent : 100;

    viewA.style[dimension] = `calc(${percent}% - ${
      gutterBounds[dimension] / 2
    }px)`;
    viewB.style[dimension] = `calc(${100 - percent}% - ${
      gutterBounds[dimension] / 2
    }px)`;

    viewA.dispatchEvent(
      new CustomEvent("splitresize", {
        bubbles: false,
        detail: {},
      }),
    );

    viewB.dispatchEvent(
      new CustomEvent("splitresize", {
        bubbles: false,
        detail: {},
      }),
    );
  };

  dragEndHandler = (e) => {
    // console.log('[dragEndHandler]', e)
    const { viewA, viewB } = this.dragContext.splitView;

    window.removeEventListener("mousemove", this.dragHandler);
    window.removeEventListener("touchmove", this.dragHandler);

    window.removeEventListener("mouseup", this.dragEndHandler);
    window.removeEventListener("mouseleave", this.dragEndHandler);
    window.removeEventListener("touchend", this.dragEndHandler);
    window.removeEventListener("touchleave", this.dragEndHandler);

    viewA.removeEventListener("selectstart", this.NOOP);
    viewA.removeEventListener("dragstart", this.NOOP);
    viewB.removeEventListener("selectstart", this.NOOP);
    viewB.removeEventListener("dragstart", this.NOOP);

    viewA.style.userSelect = "";
    viewA.style.webkitUserSelect = "";
    viewA.style.MozUserSelect = "";
    viewA.style.pointerEvents = "";

    viewB.style.userSelect = "";
    viewB.style.webkitUserSelect = "";
    viewB.style.MozUserSelect = "";
    viewB.style.pointerEvents = "";

    document.body.style.cursor = "";

    // discard current drag context
    this.dragContext = null;
  };

  //var SplitView = {}

  activate(element) {
    const splitView = this.parseSplitView(element);
    if (splitView) {
      const { positionAxis, dimension, gutter, viewA, viewB } = splitView;

      const splitViewBounds = splitView.element.getBoundingClientRect();
      const gutterBounds = gutter.getBoundingClientRect();

      let percent =
        ((gutterBounds[positionAxis] +
          gutterBounds[dimension] / 2 -
          splitViewBounds[positionAxis]) /
          splitViewBounds[dimension]) *
        100;

      // clamp 0 ~ 100
      percent = percent < 0 ? 0 : percent < 100 ? percent : 100;

      viewA.style[dimension] = `calc(${percent}% - ${
        gutterBounds[dimension] / 2
      }px)`;
      viewB.style[dimension] = `calc(${100 - percent}% - ${
        gutterBounds[dimension] / 2
      }px)`;

      gutter.addEventListener("mousedown", this.dragStartHandler);
      gutter.addEventListener("touchstart", this.dragStartHandler);

      this.activate(viewA);
      this.activate(viewB);
    }
  }
}
