/**
 * Copyright (c) 2006-2020, JGraph Ltd
 * Copyright (c) 2006-2020, draw.io AG
 *
 * Constructs the actions object for the given UI.
 */
import * as m from "../../../../../dist/mxgraph.es.js";
import { Editor } from "./Editor.js";
import { FilenameDialog } from "./Editor.js";
import { OutlineWindow } from "./Dialogs.js";
import { LayersWindow } from "./Dialogs.js";

/*
export function Actions(editorUi) {
  this.editorUi = editorUi;
  this.actions = new Object();
  this.init();
}
*/

export class Actions extends m.mxEventSource {
  constructor(editorUi) {
    super();
    this.editorUi = editorUi;
    this.actions = new Object();
    this.init();
  }

  get graph() {
     var graph =  this.editorUi.activeGraph;
     if (graph == null) {
          graph = this.editorUi.editor.graph;
     }  
     return graph;

  }

} //class end




/**
 * Adds the default actions.
 */
Actions.prototype.init = function () {
  var ui = this.editorUi;
  var editor = ui.editor;
  var that = this;

  var isGraphEnabled = function () {
    return (
      Action.prototype.isEnabled.apply(this, arguments) && that.graph.isEnabled()
    );
  };


  // File actions
  this.addAction("new...", function () {
    that.graph.openLink(ui.getUrl());
  });
  this.addAction("open...", function () {
    window.openNew = true;
    window.openKey = "open";

    ui.openFile();
  });
  this.addAction("import...", function () {
    window.openNew = false;
    window.openKey = "import";

    // Closes dialog after open
    window.openFile = new OpenFile(
      m.mxUtils.bind(this, function () {
        ui.hideDialog();
      }),
    );

    window.openFile.setConsumer(
      m.mxUtils.bind(this, function (xml, filename) {
        try {
          var doc = m.mxUtils.parseXml(xml);
          editor.graph.setSelectionCells(
            editor.graph.importGraphModel(doc.documentElement),
          );
        } catch (e) {
          m.mxUtils.alert(
            m.mxResources.get("invalidOrMissingFile") + ": " + e.message,
          );
        }
      }),
    );

    // Removes openFile if dialog is closed
    ui.showDialog(
      new OpenDialog(this).container,
      320,
      220,
      true,
      true,
      function () {
        window.openFile = null;
      },
    );
  }).isEnabled = isGraphEnabled;
  this.addAction(
    "save",
    function () {
      ui.saveFile(false);
    },
    null,
    null,
    Editor.ctrlKey + "+S",
  ).isEnabled = isGraphEnabled;
  this.addAction(
    "saveAs...",
    function () {
      ui.saveFile(true);
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+S",
  ).isEnabled = isGraphEnabled;
  this.addAction("export...", function () {
    ui.showDialog(new ExportDialog(ui).container, 300, 296, true, true);
  });
  this.addAction("editDiagram...", function () {
    var dlg = new EditDiagramDialog(ui);
    ui.showDialog(dlg.container, 620, 420, true, false);
    dlg.init();
  });
  this.addAction("pageSetup...", function () {
    ui.showDialog(new PageSetupDialog(ui).container, 320, 220, true, true);
  }).isEnabled = isGraphEnabled;
  this.addAction(
    "print...",
    function () {
      ui.showDialog(new PrintDialog(ui).container, 300, 180, true, true);
    },
    null,
    "sprite-print",
    Editor.ctrlKey + "+P",
  );
  this.addAction("preview", function () {
    m.mxUtils.show(that.graph, null, 10, 10);
  });

  // Edit actions
  this.addAction(
    "undo",
    function () {
      ui.undo();
    },
    null,
    "sprite-undo",
    Editor.ctrlKey + "+Z",
  );
  this.addAction(
    "redo",
    function () {
      ui.redo();
    },
    null,
    "sprite-redo",
    !m.mxClient.IS_WIN ? Editor.ctrlKey + "+Shift+Z" : Editor.ctrlKey + "+Y",
  );

  // Select actions
  this.addAction(
    "select",
    function () {
      ui.select();
    },
    null,
    "sprite-select",
    "select",
  );

  this.addAction(
    "pan",
    function () {
      ui.pan();
    },
    null,
    "sprite-pan",
    "pan",
  );

  this.addAction(
    "vsplit",
    function () {
      ui.diagram_vsplit();
    },
    null,
    "sprite-vsplit",
    "vertical split",
  );

  this.addAction(
    "hsplit",
    function () {
      ui.diagram_hsplit();
    },
    "HSPLIT",
    "sprite-hsplit",
    "horizontal split",
  );
  this.addAction(
    "splitfull",
    function () {
      ui.diagram_splitfull();
    },
    null,
    "sprite-split_full",
    "split full",
  );

 //
  this.addAction(
    "cut",
    function () {
      m.mxClipboard.cut(that.graph);
    },
    null,
    "sprite-cut",
    Editor.ctrlKey + "+X",
  );
  this.addAction(
    "copy",
    function () {
      try {
        m.mxClipboard.copy(that.graph);
      } catch (e) {
        ui.handleError(e);
      }
    },
    null,
    "sprite-copy",
    Editor.ctrlKey + "+C",
  );
  this.addAction(
    "paste",
    function () {
      if (that.graph.isEnabled() && !that.graph.isCellLocked(that.graph.getDefaultParent())) {
        m.mxClipboard.paste(that.graph);
      }
    },
    false,
    "sprite-paste",
    Editor.ctrlKey + "+V",
  );
  this.addAction("pasteHere", function (evt) {
    if (that.graph.isEnabled() && !that.graph.isCellLocked(that.graph.getDefaultParent())) {
      that.graph.getModel().beginUpdate();
      try {
        var cells = m.mxClipboard.paste(that.graph);

        if (cells != null) {
          var includeEdges = true;

          for (var i = 0; i < cells.length && includeEdges; i++) {
            includeEdges = includeEdges && that.graph.model.isEdge(cells[i]);
          }

          var t = that.graph.view.translate;
          var s = that.graph.view.scale;
          var dx = t.x;
          var dy = t.y;
          var bb = null;

          if (cells.length == 1 && includeEdges) {
            var geo = that.graph.getCellGeometry(cells[0]);

            if (geo != null) {
              bb = geo.getTerminalPoint(true);
            }
          }

          bb =
            bb != null
              ? bb
              : that.graph.getBoundingBoxFromGeometry(cells, includeEdges);

          if (bb != null) {
            var x = Math.round(
              that.graph.snap(thar.graph.popupMenuHandler.triggerX / s - dx),
            );
            var y = Math.round(
              that.graph.snap(that.graph.popupMenuHandler.triggerY / s - dy),
            );

            that.graph.cellsMoved(cells, x - bb.x, y - bb.y);
          }
        }
      } finally {
        that.graph.getModel().endUpdate();
      }
    }
  });

  this.addAction(
    "copySize",
    function (evt) {
      var cell = that.graph.getSelectionCell();

      if (
        that.graph.isEnabled() &&
        cell != null &&
        that.graph.getModel().isVertex(cell)
      ) {
        var geo = that.graph.getCellGeometry(cell);

        if (geo != null) {
          ui.copiedSize = new m.mxRectangle(
            geo.x,
            geo.y,
            geo.width,
            geo.height,
          );
        }
      }
    },
    null,
    null,
    "Alt+Shift+X",
  );

  this.addAction(
    "pasteSize",
    function (evt) {
      if (
        that.graph.isEnabled() &&
        !that.graph.isSelectionEmpty() &&
        ui.copiedSize != null
      ) {
        that.graph.getModel().beginUpdate();

        try {
          var cells = that.graph.getSelectionCells();

          for (var i = 0; i < cells.length; i++) {
            if (that.graph.getModel().isVertex(cells[i])) {
              var geo = that.graph.getCellGeometry(cells[i]);

              if (geo != null) {
                geo = geo.clone();
                geo.width = ui.copiedSize.width;
                geo.height = ui.copiedSize.height;

                that.graph.getModel().setGeometry(cells[i], geo);
              }
            }
          }
        } finally {
          that.graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    "Alt+Shift+V",
  );

  function deleteCells(includeEdges) {
    // Cancels interactive operations
    that.graph.escape();
    var select = that.graph.deleteCells(
      that.graph.getDeletableCells(that.graph.getSelectionCells()),
      includeEdges,
    );

    if (select != null) {
      that.graph.setSelectionCells(select);
    }

  var editor2 = ui.editor2;                                             //GS
  var graph2 = editor2.graph;
    graph2.escape();
    var select = graph2.deleteCells(
      graph2.getDeletableCells(graph2.getSelectionCells()),
      includeEdges,
    );

    if (select != null) {
      graph2.setSelectionCells(select);
    }


  }

/*
  var that = this;
  function graph() {
     var graph_ =  that.editorUi.activeGraph;
     if (graph_ == null) {
          graph_ = that.editorUi.editor.graph;
     }  
     return graph_;
  }
*/

  this.addAction(
    "delete",
    function (evt) {
      deleteCells(evt != null && m.mxEvent.isControlDown(evt));
    },
    null,
    null,
    "Delete",
  );
  this.addAction("deleteAll", function () {
    if (!that.graph().isSelectionEmpty()) {
      that.graph().getModel().beginUpdate();
      try {
        var cells = that.graph().getSelectionCells();

        for (var i = 0; i < cells.length; i++) {
          that.graph().cellLabelChanged(cells[i], "");
        }
      } finally {
        that.graph.getModel().endUpdate();
      }
    }
  });
  this.addAction(
    "deleteLabels",
    function () {
      if (!that.graph.isSelectionEmpty()) {
        that.graph.getModel().beginUpdate();
        try {
          var cells = that.graph.getSelectionCells();

          for (var i = 0; i < cells.length; i++) {
            that.graph.cellLabelChanged(cells[i], "");
          }
        } finally {
          that.graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Delete",
  );
  this.addAction(
    "duplicate",
    function () {
      try {
        that.graph.setSelectionCells(that.graph.duplicateCells());
        that.graph.scrollCellToVisible(that.graph.getSelectionCell());
      } catch (e) {
        ui.handleError(e);
      }
    },
    null,
    null,
    Editor.ctrlKey + "+D",
  );
  this.put(
    "turn",
    new Action(
      m.mxResources.get("turn") + " / " + m.mxResources.get("reverse"),
      function (evt) {
        that.graph.turnShapes(
          that.graph.getSelectionCells(),
          evt != null ? m.mxEvent.isShiftDown(evt) : false,
        );
      },
      null,
      null,
      Editor.ctrlKey + "+R",
    ),
  );
  this.addAction(
    "selectVertices",
    function () {
      that.graph.selectVertices(null, true);
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+I",
  );
  this.addAction(
    "selectEdges",
    function () {
      that.graph.selectEdges();
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+E",
  );
  this.addAction(
    "selectAll",
    function () {
      that.graph.selectAll(null, true);
    },
    null,
    null,
    Editor.ctrlKey + "+A",
  );
  this.addAction(
    "selectNone",
    function () {
      that.graph.clearSelection();
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+A",
  );
  this.addAction(
    "lockUnlock",
    function () {
      if (!that.graph.isSelectionEmpty()) {
        that.graph.getModel().beginUpdate();
        try {
          var defaultValue = that.graph.isCellMovable(that.graph.getSelectionCell())
            ? 1
            : 0;
          that.graph.toggleCellStyles(m.mxConstants.STYLE_MOVABLE, defaultValue);
          that.graph.toggleCellStyles(m.mxConstants.STYLE_RESIZABLE, defaultValue);
          that.graph.toggleCellStyles(m.mxConstants.STYLE_ROTATABLE, defaultValue);
          that.graph.toggleCellStyles(m.mxConstants.STYLE_DELETABLE, defaultValue);
          that.graph.toggleCellStyles(m.mxConstants.STYLE_EDITABLE, defaultValue);
          that.graph.toggleCellStyles("connectable", defaultValue);
        } finally {
          that.graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    Editor.ctrlKey + "+L",
  );

  // Navigation actions
  this.addAction(
    "home",
    function () {
      that.graph.home();
    },
    null,
    null,
    "Shift+Home",
  );
  this.addAction(
    "exitGroup",
    function () {
      that.graph.exitGroup();
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+Home",
  );
  this.addAction(
    "enterGroup",
    function () {
      that.graph.enterGroup();
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+End",
  );
  this.addAction(
    "collapse",
    function () {
      that.graph.foldCells(true);
    },
    null,
    null,
    Editor.ctrlKey + "+Home",
  );
  this.addAction(
    "expand",
    function () {
      that.graph.foldCells(false);
    },
    null,
    null,
    Editor.ctrlKey + "+End",
  );

  // Arrange actions
  this.addAction(
    "toFront",
    function () {    // GS
      that.graph.orderCells(false);
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+F",
  );
  this.addAction(
    "toBack",
    function () {
      that.graph.orderCells(true);
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+B",
  );
  this.addAction(
    "group",
    function () {
      if (that.graph.isEnabled()) {
        var cells = m.mxUtils.sortCells(that.graph.getSelectionCells(), true);

        if (
          cells.length == 1 &&
          !that.graph.isTable(cells[0]) &&
          !that.graph.isTableRow(cells[0])
        ) {
          that.graph.setCellStyles("container", "1");
        } else {
          cells = that.graph.getCellsForGroup(cells);

          if (cells.length > 1) {
            that.graph.setSelectionCell(that.graph.groupCells(null, 0, cells));
          }
        }
      }
    },
    null,
    null,
    Editor.ctrlKey + "+G",
  );
  this.addAction(
    "ungroup",
    function () {
      if (that.graph.isEnabled()) {
        var cells = that.graph.getSelectionCells();

        that.graph.model.beginUpdate();
        try {
          var temp = that.graph.ungroupCells();

          // Clears container flag for remaining cells
          if (cells != null) {
            for (var i = 0; i < cells.length; i++) {
              if (that.graph.model.contains(cells[i])) {
                if (
                  that.graph.model.getChildCount(cells[i]) == 0 &&
                  that.graph.model.isVertex(cells[i])
                ) {
                  that.graph.setCellStyles("container", "0", [cells[i]]);
                }

                temp.push(cells[i]);
              }
            }
          }
        } finally {
          that.graph.model.endUpdate();
        }

        that.graph.setSelectionCells(temp);
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+U",
  );
  this.addAction("removeFromGroup", function () {
    if (that.graph.isEnabled()) {
      var cells = that.graph.getSelectionCells();

      // Removes table rows and cells
      if (cells != null) {
        var temp = [];

        for (var i = 0; i < cells.length; i++) {
          if (!that.graph.isTableRow(cells[i]) && !that.graph.isTableCell(cells[i])) {
            temp.push(cells[i]);
          }
        }

        that.graph.removeCellsFromParent(temp);
      }
    }
  });
  // Adds action
  this.addAction(
    "edit",
    function () {
      if (that.graph.isEnabled()) {
        that.graph.startEditingAtCell();
      }
    },
    null,
    null,
    "F2/Enter",
  );
  this.addAction(
    "editData...",
    function () {
      var cell = that.graph.getSelectionCell() || that.graph.getModel().getRoot();
      ui.showDataDialog(cell);
    },
    null,
    null,
    Editor.ctrlKey + "+M",
  );
  this.addAction(
    "editTooltip...",
    function () {
      if (that.graph.isEnabled() && !that.graph.isSelectionEmpty()) {
        var cell = that.graph.getSelectionCell();
        var tooltip = "";

        if (m.mxUtils.isNode(cell.value)) {
          var tmp = null;

          if (
            Graph.translateDiagram &&
            Graph.diagramLanguage != null &&
            cell.value.hasAttribute("tooltip_" + Graph.diagramLanguage)
          ) {
            tmp = cell.value.getAttribute("tooltip_" + Graph.diagramLanguage);
          }

          if (tmp == null) {
            tmp = cell.value.getAttribute("tooltip");
          }

          if (tmp != null) {
            tooltip = tmp;
          }
        }

        var dlg = new TextareaDialog(
          ui,
          m.mxResources.get("editTooltip") + ":",
          tooltip,
          function (newValue) {
            that.graph.setTooltipForCell(cell, newValue);
          },
        );
        ui.showDialog(dlg.container, 320, 200, true, true);
        dlg.init();
      }
    },
    null,
    null,
    "Alt+Shift+T",
  );
  this.addAction("openLink", function () {
    var link = that.graph.getLinkForCell(that.graph.getSelectionCell());

    if (link != null) {
      that.graph.openLink(link);
    }
  });
  this.addAction(
    "editLink...",
    function () {
      if (that.graph.isEnabled() && !that.graph.isSelectionEmpty()) {
        var cell = that.graph.getSelectionCell();
        var value = that.graph.getLinkForCell(cell) || "";

        ui.showLinkDialog(value, m.mxResources.get("apply"), function (link) {
          link = m.mxUtils.trim(link);
          that.graph.setLinkForCell(cell, link.length > 0 ? link : null);
        });
      }
    },
    null,
    null,
    "Alt+Shift+L",
  );
  this.put(
    "insertImage",
    new Action(m.mxResources.get("image") + "...", function () {
      if (that.graph.isEnabled() && !that.graph.isCellLocked(that.graph.getDefaultParent())) {
        that.graph.clearSelection();
        ui.actions.get("image").funct();
      }
    }),
  ).isEnabled = isGraphEnabled;
  this.put(
    "insertLink",
    new Action(m.mxResources.get("link") + "...", function () {
      if (that.graph.isEnabled() && !that.graph.isCellLocked(that.graph.getDefaultParent())) {
        ui.showLinkDialog(
          "",
          m.mxResources.get("insert"),
          function (link, docs) {
            link = m.mxUtils.trim(link);

            if (link.length > 0) {
              var icon = null;
              var title = that.graph.getLinkTitle(link);

              if (docs != null && docs.length > 0) {
                icon = docs[0].iconUrl;
                title = docs[0].name || docs[0].type;
                title = title.charAt(0).toUpperCase() + title.substring(1);

                if (title.length > 30) {
                  title = title.substring(0, 30) + "...";
                }
              }

              var linkCell = new m.mxCell(
                title,
                new m.mxGeometry(0, 0, 100, 40),
                "fontColor=#0000EE;fontStyle=4;rounded=1;overflow=hidden;" +
                  (icon != null
                    ? "shape=label;imageWidth=16;imageHeight=16;spacingLeft=26;align=left;image=" +
                      icon
                    : "spacing=10;"),
              );
              linkCell.vertex = true;

              var pt = that.graph.getCenterInsertPoint(
                that.graph.getBoundingBoxFromGeometry([linkCell], true),
              );
              linkCell.geometry.x = pt.x;
              linkCell.geometry.y = pt.y;

              that.graph.setLinkForCell(linkCell, link);
              that.graph.cellSizeUpdated(linkCell, true);

              that.graph.getModel().beginUpdate();
              try {
                linkCell = that.graph.addCell(linkCell);
                that.graph.fireEvent(
                  new m.mxEventObject("cellsInserted", "cells", [linkCell]),
                );
              } finally {
                that.graph.getModel().endUpdate();
              }

              that.graph.setSelectionCell(linkCell);
              that.graph.scrollCellToVisible(that.graph.getSelectionCell());
            }
          },
        );
      }
    }),
  ).isEnabled = isGraphEnabled;
  this.addAction(
    "link...",
    m.mxUtils.bind(this, function () {
      if (that.graph.isEnabled()) {
        if (that.graph.cellEditor.isContentEditing()) {
          var elt = that.graph.getSelectedElement();
          var link = that.graph.getParentByName(elt, "A", that.graph.cellEditor.textarea);
          var oldValue = "";

          // Workaround for FF returning the outermost selected element after double
          // click on a DOM hierarchy with a link inside (but not as topmost element)
          if (link == null && elt != null && elt.getElementsByTagName != null) {
            // Finds all links in the selected DOM and uses the link
            // where the selection text matches its text content
            var links = elt.getElementsByTagName("a");

            for (var i = 0; i < links.length && link == null; i++) {
              if (links[i].textContent == elt.textContent) {
                link = links[i];
              }
            }
          }

          if (link != null && link.nodeName == "A") {
            oldValue = link.getAttribute("href") || "";
            that.graph.selectNode(link);
          }

          var selState = that.graph.cellEditor.saveSelection();

          ui.showLinkDialog(
            oldValue,
            m.mxResources.get("apply"),
            m.mxUtils.bind(this, function (value) {
              that.graph.cellEditor.restoreSelection(selState);

              if (value != null) {
                that.graph.insertLink(value);
              }
            }),
          );
        } else if (that.graph.isSelectionEmpty()) {
          this.get("insertLink").funct();
        } else {
          this.get("editLink").funct();
        }
      }
    }),
  ).isEnabled = isGraphEnabled;
  this.addAction(
    "autosize",
    function () {
      var cells = that.graph.getSelectionCells();

      if (cells != null) {
        that.graph.getModel().beginUpdate();
        try {
          for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];

            if (that.graph.getModel().getChildCount(cell)) {
              that.graph.updateGroupBounds([cell], 20);
            } else {
              var state = that.graph.view.getState(cell);
              var geo = that.graph.getCellGeometry(cell);

              if (
                that.graph.getModel().isVertex(cell) &&
                state != null &&
                state.text != null &&
                geo != null &&
                that.graph.isWrapping(cell)
              ) {
                geo = geo.clone();
                geo.height = state.text.boundingBox.height / that.graph.view.scale;
                that.graph.getModel().setGeometry(cell, geo);
              } else {
                that.graph.updateCellSize(cell);
              }
            }
          }
        } finally {
          that.graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+Y",
  );
  this.addAction("formattedText", function () {
    var refState = that.graph.getView().getState(that.graph.getSelectionCell());

    if (refState != null) {
      that.graph.stopEditing();
      var value = refState.style["html"] == "1" ? null : "1";

      that.graph.getModel().beginUpdate();
      try {
        var cells = that.graph.getSelectionCells();

        for (var i = 0; i < cells.length; i++) {
          state = that.graph.getView().getState(cells[i]);

          if (state != null) {
            var html = m.mxUtils.getValue(state.style, "html", "0");

            if (html == "1" && value == null) {
              var label = that.graph.convertValueToString(state.cell);

              if (m.mxUtils.getValue(state.style, "nl2Br", "1") != "0") {
                // Removes newlines from HTML and converts breaks to newlines
                // to match the HTML output in plain text
                label = label.replace(/\n/g, "").replace(/<br\s*.?>/g, "\n");
              }

              // Removes HTML tags
              var temp = document.createElement("div");
              temp.innerHTML = that.graph.sanitizeHtml(label);
              label = m.mxUtils.extractTextWithWhitespace(temp.childNodes);

              that.graph.cellLabelChanged(state.cell, label);
              that.graph.setCellStyles("html", value, [cells[i]]);
            } else if (html == "0" && value == "1") {
              // Converts HTML tags to text
              var label = m.mxUtils.htmlEntities(
                that.graph.convertValueToString(state.cell),
                false,
              );

              if (m.mxUtils.getValue(state.style, "nl2Br", "1") != "0") {
                // Converts newlines in plain text to breaks in HTML
                // to match the plain text output
                label = label.replace(/\n/g, "<br/>");
              }

              that.graph.cellLabelChanged(state.cell, that.graph.sanitizeHtml(label));
              that.graph.setCellStyles("html", value, [cells[i]]);
            }
          }
        }

        ui.fireEvent(
          new m.mxEventObject(
            "styleChanged",
            "keys",
            ["html"],
            "values",
            [value != null ? value : "0"],
            "cells",
            cells,
          ),
        );
      } finally {
        that.graph.getModel().endUpdate();
      }
    }
  });
  this.addAction("wordWrap", function () {
    var state = that.graph.getView().getState(that.graph.getSelectionCell());
    var value = "wrap";

    that.graph.stopEditing();

    if (
      state != null &&
      state.style[m.mxConstants.STYLE_WHITE_SPACE] == "wrap"
    ) {
      value = null;
    }

    that.graph.setCellStyles(m.mxConstants.STYLE_WHITE_SPACE, value);
  });
  this.addAction("rotation", function () {
    var value = "0";
    var state = that.graph.getView().getState(that.graph.getSelectionCell());

    if (state != null) {
      value = state.style[m.mxConstants.STYLE_ROTATION] || value;
    }

    var dlg = new FilenameDialog(
      ui,
      value,
      m.mxResources.get("apply"),
      function (newValue) {
        if (newValue != null && newValue.length > 0) {
          that.graph.setCellStyles(m.mxConstants.STYLE_ROTATION, newValue);
        }
      },
      m.mxResources.get("enterValue") +
        " (" +
        m.mxResources.get("rotation") +
        " 0-360)",
    );

    ui.showDialog(dlg.container, 375, 80, true, true);
    dlg.init();
  });
  // View actions
  this.addAction(
    "resetView",
    function () {
      that.graph.zoomTo(1);
      ui.resetScrollbars();
    },
    null,
    null,
    "Home",
  );
  this.addAction(
    "zoomIn",
    function (evt) {
      if (that.graph.isFastZoomEnabled()) {
        that.graph.lazyZoom(true, true, ui.buttonZoomDelay);
      } else {
        that.graph.zoomIn();
      }
    },
    null,
    null,
    Editor.ctrlKey + " + (Numpad) / Alt+Mousewheel",
  );
  this.addAction(
    "zoomOut",
    function (evt) {
      if (that.graph.isFastZoomEnabled()) {
        that.graph.lazyZoom(false, true, ui.buttonZoomDelay);
      } else {
        that.graph.zoomOut();
      }
    },
    null,
    null,
    Editor.ctrlKey + " - (Numpad) / Alt+Mousewheel",
  );
  this.addAction(
    "fitWindow",
    function () {
      var bounds = that.graph.isSelectionEmpty()
        ? that.graph.getGraphBounds()
        : that.graph.getBoundingBox(that.graph.getSelectionCells());
      var t = that.graph.view.translate;
      var s = that.graph.view.scale;

      bounds.x = bounds.x / s - t.x;
      bounds.y = bounds.y / s - t.y;
      bounds.width /= s;
      bounds.height /= s;

      if (that.graph.backgroundImage != null) {
        bounds.add(
          new m.mxRectangle(
            0,
            0,
            that.graph.backgroundImage.width,
            that.graph.backgroundImage.height,
          ),
        );
      }

      if (bounds.width == 0 || bounds.height == 0) {
        that.graph.zoomTo(1);
        ui.resetScrollbars();
      } else {
        that.graph.fitWindow(bounds);
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+H",
  );
  this.addAction(
    "fitPage",
    m.mxUtils.bind(this, function () {
      if (!that.graph.pageVisible) {
        this.get("pageView").funct();
      }

      var fmt = that.graph.pageFormat;
      var ps = that.graph.pageScale;
      var cw = that.graph.container.clientWidth - 10;
      var ch = that.graph.container.clientHeight - 10;
      var scale =
        Math.floor(20 * Math.min(cw / fmt.width / ps, ch / fmt.height / ps)) /
        20;
      that.graph.zoomTo(scale);

      if (m.mxUtils.hasScrollbars(that.graph.container)) {
        var pad = that.graph.getPagePadding();
        that.graph.container.scrollTop = pad.y * that.graph.view.scale - 1;
        that.graph.container.scrollLeft =
          Math.min(
            pad.x * that.graph.view.scale,
            (that.graph.container.scrollWidth - that.graph.container.clientWidth) / 2,
          ) - 1;
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+J",
  );
  this.addAction(
    "fitTwoPages",
    m.mxUtils.bind(this, function () {
      if (!that.graph.pageVisible) {
        this.get("pageView").funct();
      }

      var fmt = that.graph.pageFormat;
      var ps = that.graph.pageScale;
      var cw = that.graph.container.clientWidth - 10;
      var ch = that.graph.container.clientHeight - 10;

      var scale =
        Math.floor(
          20 * Math.min(cw / (2 * fmt.width) / ps, ch / fmt.height / ps),
        ) / 20;
      that.graph.zoomTo(scale);

      if (m.mxUtils.hasScrollbars(that.graph.container)) {
        var pad = that.graph.getPagePadding();
        that.graph.container.scrollTop = Math.min(
          pad.y,
          (that.graph.container.scrollHeight - that.graph.container.clientHeight) / 2,
        );
        that.graph.container.scrollLeft = Math.min(
          pad.x,
          (that.graph.container.scrollWidth - that.graph.container.clientWidth) / 2,
        );
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+Shift+J",
  );
  this.addAction(
    "fitPageWidth",
    m.mxUtils.bind(this, function () {
      if (!that.graph.pageVisible) {
        this.get("pageView").funct();
      }

      var fmt = that.graph.pageFormat;
      var ps = that.graph.pageScale;
      var cw = that.graph.container.clientWidth - 10;

      var scale = Math.floor((20 * cw) / fmt.width / ps) / 20;
      that.graph.zoomTo(scale);

      if (m.mxUtils.hasScrollbars(that.graph.container)) {
        var pad = that.graph.getPagePadding();
        that.graph.container.scrollLeft = Math.min(
          pad.x * that.graph.view.scale,
          (that.graph.container.scrollWidth - that.graph.container.clientWidth) / 2,
        );
      }
    }),
  );
  this.put(
    "customZoom",
    new Action(
      m.mxResources.get("custom") + "...",
      m.mxUtils.bind(this, function () {
        var dlg = new FilenameDialog(
          this.editorUi,
          parseInt(that.graph.getView().getScale() * 100),
          m.mxResources.get("apply"),
          m.mxUtils.bind(this, function (newValue) {
            var val = parseInt(newValue);

            if (!isNaN(val) && val > 0) {
              that.graph.zoomTo(val / 100);
            }
          }),
          m.mxResources.get("zoom") + " (%)",
        );
        this.editorUi.showDialog(dlg.container, 300, 80, true, true);
        dlg.init();
      }),
      null,
      null,
      Editor.ctrlKey + "+0",
    ),
  );
  this.addAction(
    "pageScale...",
    m.mxUtils.bind(this, function () {
      var dlg = new FilenameDialog(
        this.editorUi,
        parseInt(that.graph.pageScale * 100),
        m.mxResources.get("apply"),
        m.mxUtils.bind(this, function (newValue) {
          var val = parseInt(newValue);

          if (!isNaN(val) && val > 0) {
            var change = new ChangePageSetup(ui, null, null, null, val / 100);
            change.ignoreColor = true;
            change.ignoreImage = true;

            that.graph.model.execute(change);
          }
        }),
        m.mxResources.get("pageScale") + " (%)",
      );
      this.editorUi.showDialog(dlg.container, 300, 80, true, true);
      dlg.init();
    }),
  );

  // Option actions
  var action = null;
  action = this.addAction(
    "grid",
    function () {
      that.graph.setGridEnabled(!that.graph.isGridEnabled());
      ui.fireEvent(new m.mxEventObject("gridEnabledChanged"));
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+G",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.isGridEnabled();
  });
  action.setEnabled(false);

  action = this.addAction("guides", function () {
    that.graph.graphHandler.guidesEnabled = !that.graph.graphHandler.guidesEnabled;
    ui.fireEvent(new m.mxEventObject("guidesEnabledChanged"));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.graphHandler.guidesEnabled;
  });
  action.setEnabled(false);

  action = this.addAction("tooltips", function () {
    that.graph.tooltipHandler.setEnabled(!that.graph.tooltipHandler.isEnabled());
    ui.fireEvent(new m.mxEventObject("tooltipsEnabledChanged"));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.tooltipHandler.isEnabled();
  });

  action = this.addAction("collapseExpand", function () {
    var change = new ChangePageSetup(ui);
    change.ignoreColor = true;
    change.ignoreImage = true;
    change.foldingEnabled = !that.graph.foldingEnabled;

    that.graph.model.execute(change);
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.foldingEnabled;
  });
  action.isEnabled = isGraphEnabled;
  action = this.addAction("scrollbars", function () {
    ui.setScrollbars(!ui.hasScrollbars());
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.scrollbars;
  });
  action = this.addAction(
    "pageView",
    m.mxUtils.bind(this, function () {
      ui.setPageVisible(!that.graph.pageVisible);
    }),
  );
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.pageVisible;
  });
  action = this.addAction(
    "connectionArrows",
    function () {
      that.graph.connectionArrowsEnabled = !that.graph.connectionArrowsEnabled;
      ui.fireEvent(new m.mxEventObject("connectionArrowsChanged"));
    },
    null,
    null,
    "Alt+Shift+A",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.connectionArrowsEnabled;
  });
  action = this.addAction(
    "connectionPoints",
    function () {
      that.graph.setConnectable(!that.graph.connectionHandler.isEnabled());
      ui.fireEvent(new m.mxEventObject("connectionPointsChanged"));
    },
    null,
    null,
    "Alt+Shift+P",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.connectionHandler.isEnabled();
  });
  action = this.addAction("copyConnect", function () {
    that.graph.connectionHandler.setCreateTarget(
      !that.graph.connectionHandler.isCreateTarget(),
    );
    ui.fireEvent(new m.mxEventObject("copyConnectChanged"));
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return that.graph.connectionHandler.isCreateTarget();
  });
  action.isEnabled = isGraphEnabled;
  action = this.addAction("autosave", function () {
    ui.editor.setAutosave(!ui.editor.autosave);
  });
  action.setToggleAction(true);
  action.setSelectedCallback(function () {
    return ui.editor.autosave;
  });
  action.isEnabled = isGraphEnabled;
  action.visible = false;

  // Help actions
  this.addAction("help", function () {
    var ext = "";

    if (m.mxResources.isLanguageSupported(m.mxClient.language)) {
      ext = "_" + m.mxClient.language;
    }

    that.graph.openLink(RESOURCES_PATH + "/help" + ext + ".html");
  });

  var showingAbout = false;

  this.put(
    "about",
    new Action(m.mxResources.get("about") + " Graph Editor...", function () {
      if (!showingAbout) {
        ui.showDialog(
          new AboutDialog(ui).container,
          320,
          280,
          true,
          true,
          function () {
            showingAbout = false;
          },
        );

        showingAbout = true;
      }
    }),
  );

  // Font style actions
  var toggleFontStyle = m.mxUtils.bind(
    this,
    function (key, style, fn, shortcut) {
      return this.addAction(
        key,
        function () {
          if (fn != null && that.graph.cellEditor.isContentEditing()) {
            fn();
          } else {
            that.graph.stopEditing(false);

            that.graph.getModel().beginUpdate();
            try {
              var cells = that.graph.getSelectionCells();
              that.graph.toggleCellStyleFlags(
                m.mxConstants.STYLE_FONTSTYLE,
                style,
                cells,
              );

              // Removes bold and italic tags and CSS styles inside labels
              if (
                (style & m.mxConstants.FONT_BOLD) ==
                m.mxConstants.FONT_BOLD
              ) {
                that.graph.updateLabelElements(
                  that.graph.getSelectionCells(),
                  function (elt) {
                    elt.style.fontWeight = null;

                    if (elt.nodeName == "B") {
                      that.graph.replaceElement(elt);
                    }
                  },
                );
              } else if (
                (style & m.mxConstants.FONT_ITALIC) ==
                m.mxConstants.FONT_ITALIC
              ) {
                that.graph.updateLabelElements(
                  that.graph.getSelectionCells(),
                  function (elt) {
                    elt.style.fontStyle = null;

                    if (elt.nodeName == "I") {
                      that.graph.replaceElement(elt);
                    }
                  },
                );
              } else if (
                (style & m.mxConstants.FONT_UNDERLINE) ==
                m.mxConstants.FONT_UNDERLINE
              ) {
                that.graph.updateLabelElements(
                  that.graph.getSelectionCells(),
                  function (elt) {
                    elt.style.textDecoration = null;

                    if (elt.nodeName == "U") {
                      that.graph.replaceElement(elt);
                    }
                  },
                );
              }

              for (var i = 0; i < cells.length; i++) {
                if (that.graph.model.getChildCount(cells[i]) == 0) {
                  that.graph.autoSizeCell(cells[i], false);
                }
              }
            } finally {
              that.graph.getModel().endUpdate();
            }
          }
        },
        null,
        null,
        shortcut,
      );
    },
  );

  toggleFontStyle(
    "bold",
    m.mxConstants.FONT_BOLD,
    function () {
      document.execCommand("bold", false, null);
    },
    Editor.ctrlKey + "+B",
  );
  toggleFontStyle(
    "italic",
    m.mxConstants.FONT_ITALIC,
    function () {
      document.execCommand("italic", false, null);
    },
    Editor.ctrlKey + "+I",
  );
  toggleFontStyle(
    "underline",
    m.mxConstants.FONT_UNDERLINE,
    function () {
      document.execCommand("underline", false, null);
    },
    Editor.ctrlKey + "+U",
  );

  // Color actions
  this.addAction("fontColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_FONTCOLOR, "forecolor", "000000");
  });
  this.addAction("strokeColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_STROKECOLOR);
  });
  this.addAction("fillColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_FILLCOLOR);
  });
  this.addAction("gradientColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_GRADIENTCOLOR);
  });
  this.addAction("backgroundColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR, "backcolor");
  });
  this.addAction("borderColor...", function () {
    ui.menus.pickColor(m.mxConstants.STYLE_LABEL_BORDERCOLOR);
  });

  // Format actions
  this.addAction("vertical", function () {
    ui.menus.toggleStyle(m.mxConstants.STYLE_HORIZONTAL, true);
  });
  this.addAction("shadow", function () {
    ui.menus.toggleStyle(m.mxConstants.STYLE_SHADOW);
  });
  this.addAction("solid", function () {
    that.graph.getModel().beginUpdate();
    try {
      that.graph.setCellStyles(m.mxConstants.STYLE_DASHED, null);
      that.graph.setCellStyles(m.mxConstants.STYLE_DASH_PATTERN, null);
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_DASHED, m.mxConstants.STYLE_DASH_PATTERN],
          "values",
          [null, null],
          "cells",
          that.graph.getSelectionCells(),
        ),
      );
    } finally {
      that.graph.getModel().endUpdate();
    }
  });
  this.addAction("dashed", function () {
    that.graph.getModel().beginUpdate();
    try {
      that.graph.setCellStyles(m.mxConstants.STYLE_DASHED, "1");
      that.graph.setCellStyles(m.mxConstants.STYLE_DASH_PATTERN, null);
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_DASHED, m.mxConstants.STYLE_DASH_PATTERN],
          "values",
          ["1", null],
          "cells",
          that.graph.getSelectionCells(),
        ),
      );
    } finally {
      that.graph.getModel().endUpdate();
    }
  });
  this.addAction("dotted", function () {
    that.graph.getModel().beginUpdate();
    try {
      that.graph.setCellStyles(m.mxConstants.STYLE_DASHED, "1");
      that.graph.setCellStyles(m.mxConstants.STYLE_DASH_PATTERN, "1 4");
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_DASHED, m.mxConstants.STYLE_DASH_PATTERN],
          "values",
          ["1", "1 4"],
          "cells",
          that.graph.getSelectionCells(),
        ),
      );
    } finally {
      that.graph.getModel().endUpdate();
    }
  });
  this.addAction("sharp", function () {
    that.graph.getModel().beginUpdate();
    try {
      that.graph.setCellStyles(m.mxConstants.STYLE_ROUNDED, "0");
      that.graph.setCellStyles(m.mxConstants.STYLE_CURVED, "0");
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_ROUNDED, m.mxConstants.STYLE_CURVED],
          "values",
          ["0", "0"],
          "cells",
          that.graph.getSelectionCells(),
        ),
      );
    } finally {
      that.graph.getModel().endUpdate();
    }
  });
  this.addAction("rounded", function () {
    that.graph.getModel().beginUpdate();
    try {
      that.graph.setCellStyles(m.mxConstants.STYLE_ROUNDED, "1");
      that.graph.setCellStyles(m.mxConstants.STYLE_CURVED, "0");
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_ROUNDED, m.mxConstants.STYLE_CURVED],
          "values",
          ["1", "0"],
          "cells",
          that.graph.getSelectionCells(),
        ),
      );
    } finally {
      that.graph.getModel().endUpdate();
    }
  });
  this.addAction("toggleRounded", function () {
    if (!that.graph.isSelectionEmpty() && that.graph.isEnabled()) {
      that.graph.getModel().beginUpdate();
      try {
        var cells = that.graph.getSelectionCells();
        var style = that.graph.getCurrentCellStyle(cells[0]);
        var value =
          m.mxUtils.getValue(style, m.mxConstants.STYLE_ROUNDED, "0") == "1"
            ? "0"
            : "1";

        that.graph.setCellStyles(m.mxConstants.STYLE_ROUNDED, value);
        that.graph.setCellStyles(m.mxConstants.STYLE_CURVED, null);
        ui.fireEvent(
          new m.mxEventObject(
            "styleChanged",
            "keys",
            [m.mxConstants.STYLE_ROUNDED, m.mxConstants.STYLE_CURVED],
            "values",
            [value, "0"],
            "cells",
            that.graph.getSelectionCells(),
          ),
        );
      } finally {
        that.graph.getModel().endUpdate();
      }
    }
  });
  this.addAction("curved", function () {
    that.graph.getModel().beginUpdate();

    try {
      that.graph.setCellStyles(m.mxConstants.STYLE_ROUNDED, "0");
      that.graph.setCellStyles(m.mxConstants.STYLE_CURVED, "1");
      ui.fireEvent(
        new m.mxEventObject(
          "styleChanged",
          "keys",
          [m.mxConstants.STYLE_ROUNDED, m.mxConstants.STYLE_CURVED],
          "values",
          ["0", "1"],
          "cells",
          that.graph.getSelectionCells(),
        ),
      );
    } finally {
      that.graph.getModel().endUpdate();
    }
  });
  this.addAction("collapsible", function () {
    var state = that.graph.view.getState(that.graph.getSelectionCell());
    var value = "1";

    if (state != null && that.graph.getFoldingImage(state) != null) {
      value = "0";
    }

    that.graph.setCellStyles("collapsible", value);
    ui.fireEvent(
      new m.mxEventObject(
        "styleChanged",
        "keys",
        ["collapsible"],
        "values",
        [value],
        "cells",
        that.graph.getSelectionCells(),
      ),
    );
  });
  this.addAction(
    "editStyle...",
    m.mxUtils.bind(this, function () {
      var cells = that.graph.getSelectionCells();

      if (cells != null && cells.length > 0) {
        var model = that.graph.getModel();

        var dlg = new TextareaDialog(
          this.editorUi,
          m.mxResources.get("editStyle") + ":",
          model.getStyle(cells[0]) || "",
          function (newValue) {
            if (newValue != null) {
              that.graph.setCellStyle(m.mxUtils.trim(newValue), cells);
            }
          },
          null,
          null,
          400,
          220,
        );
        this.editorUi.showDialog(dlg.container, 420, 300, true, true);
        dlg.init();
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+E",
  );
  this.addAction(
    "setAsDefaultStyle",
    function () {
      if (that.graph.isEnabled() && !that.graph.isSelectionEmpty()) {
        ui.setDefaultStyle(that.graph.getSelectionCell());
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+D",
  );
  this.addAction(
    "clearDefaultStyle",
    function () {
      if (that.graph.isEnabled()) {
        ui.clearDefaultStyle();
      }
    },
    null,
    null,
    Editor.ctrlKey + "+Shift+R",
  );
  this.addAction("addWaypoint", function () {
    var cell = that.graph.getSelectionCell();

    if (cell != null && that.graph.getModel().isEdge(cell)) {
      //var handler = editor.graph.selectionCellsHandler.getHandler(cell);
      var handler = that.graph.selectionCellsHandler.getHandler(cell);

      if (handler instanceof m.mxEdgeHandler) {
        var t = that.graph.view.translate;
        var s = that.graph.view.scale;
        var dx = t.x;
        var dy = t.y;

        var parent = that.graph.getModel().getParent(cell);
        var pgeo = that.graph.getCellGeometry(parent);

        while (that.graph.getModel().isVertex(parent) && pgeo != null) {
          dx += pgeo.x;
          dy += pgeo.y;

          parent = that.graph.getModel().getParent(parent);
          pgeo = that.graph.getCellGeometry(parent);
        }

        var x = Math.round(
          that.graph.snap(that.graph.popupMenuHandler.triggerX / s - dx),
        );
        var y = Math.round(
          that.graph.snap(that.graph.popupMenuHandler.triggerY / s - dy),
        );

        handler.addPointAt(handler.state, x, y);
      }
    }
  });
  this.addAction("removeWaypoint", function () {
    // TODO: Action should run with "this" set to action
    var rmWaypointAction = ui.actions.get("removeWaypoint");

    if (rmWaypointAction.handler != null) {
      // NOTE: Popupevent handled and action updated in Menus.createPopupMenu
      rmWaypointAction.handler.removePoint(
        rmWaypointAction.handler.state,
        rmWaypointAction.index,
      );
    }
  });
  this.addAction(
    "clearWaypoints",
    function () {
      var cells = that.graph.getSelectionCells();

      if (cells != null) {
        cells = that.graph.addAllEdges(cells);

        that.graph.getModel().beginUpdate();
        try {
          for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];

            if (that.graph.getModel().isEdge(cell)) {
              var geo = that.graph.getCellGeometry(cell);

              if (geo != null) {
                geo = geo.clone();
                geo.points = null;
                that.graph.getModel().setGeometry(cell, geo);
              }
            }
          }
        } finally {
          that.graph.getModel().endUpdate();
        }
      }
    },
    null,
    null,
    "Alt+Shift+C",
  );
  action = this.addAction(
    "subscript",
    m.mxUtils.bind(this, function () {
      if (that.graph.cellEditor.isContentEditing()) {
        document.execCommand("subscript", false, null);
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+,",
  );
  action = this.addAction(
    "superscript",
    m.mxUtils.bind(this, function () {
      if (that.graph.cellEditor.isContentEditing()) {
        document.execCommand("superscript", false, null);
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+.",
  );
  action = this.addAction(
    "indent",
    m.mxUtils.bind(this, function () {
      // NOTE: Alt+Tab for outdent implemented via special code in
      // keyHandler.getFunction in EditorUi.js. Ctrl+Tab is reserved.
      if (that.graph.cellEditor.isContentEditing()) {
        document.execCommand("indent", false, null);
      }
    }),
    null,
    null,
    "Shift+Tab",
  );
  this.addAction("image...", function () {
    if (that.graph.isEnabled() && !that.graph.isCellLocked(that.graph.getDefaultParent())) {
      var title =
        m.mxResources.get("image") + " (" + m.mxResources.get("url") + "):";
      var state = that.graph.getView().getState(that.graph.getSelectionCell());
      var value = "";

      if (state != null) {
        value = state.style[m.mxConstants.STYLE_IMAGE] || value;
      }

      var selectionState = that.graph.cellEditor.saveSelection();

      ui.showImageDialog(
        title,
        value,
        function (newValue, w, h) {
          // Inserts image into HTML text
          if (that.graph.cellEditor.isContentEditing()) {
            that.graph.cellEditor.restoreSelection(selectionState);
            that.graph.insertImage(newValue, w, h);
          } else {
            var cells = that.graph.getSelectionCells();

            if (newValue != null && (newValue.length > 0 || cells.length > 0)) {
              var select = null;

              that.graph.getModel().beginUpdate();
              try {
                // Inserts new cell if no cell is selected
                if (cells.length == 0) {
                  cells = [
                    taht.graph.insertVertex(
                      that.graph.getDefaultParent(),
                      null,
                      "",
                      0,
                      0,
                      w,
                      h,
                      "shape=image;imageAspect=0;aspect=fixed;verticalLabelPosition=bottom;verticalAlign=top;",
                    ),
                  ];
                  var pt = that.graph.getCenterInsertPoint(
                    that.graph.getBoundingBoxFromGeometry(cells, true),
                  );
                  cells[0].geometry.x = pt.x;
                  cells[0].geometry.y = pt.y;

                  select = cells;
                  that.graph.fireEvent(
                    new m.mxEventObject("cellsInserted", "cells", select),
                  );
                }

                that.graph.setCellStyles(
                  m.mxConstants.STYLE_IMAGE,
                  newValue.length > 0 ? newValue : null,
                  cells,
                );

                // Sets shape only if not already shape with image (label or image)
                var style = that.graph.getCurrentCellStyle(cells[0]);

                if (
                  style[m.mxConstants.STYLE_SHAPE] != "image" &&
                  style[m.mxConstants.STYLE_SHAPE] != "label"
                ) {
                  that.graph.setCellStyles(
                    m.mxConstants.STYLE_SHAPE,
                    "image",
                    cells,
                  );
                } else if (newValue.length == 0) {
                  that.graph.setCellStyles(m.mxConstants.STYLE_SHAPE, null, cells);
                }

                if (that.graph.getSelectionCount() == 1) {
                  if (w != null && h != null) {
                    var cell = cells[0];
                    var geo = that.graph.getModel().getGeometry(cell);

                    if (geo != null) {
                      geo = geo.clone();
                      geo.width = w;
                      geo.height = h;
                      that.graph.getModel().setGeometry(cell, geo);
                    }
                  }
                }
              } finally {
                that.graph.getModel().endUpdate();
              }

              if (select != null) {
                that.graph.setSelectionCells(select);
                that.graph.scrollCellToVisible(select[0]);
              }
            }
          }
        },
        that.graph.cellEditor.isContentEditing(),
        !that.graph.cellEditor.isContentEditing(),
      );
    }
  }).isEnabled = isGraphEnabled;
  action = this.addAction(
    "layers",
    m.mxUtils.bind(this, function () {
      if (this.layersWindow == null) {
        // LATER: Check outline window for initial placement
        this.layersWindow = new LayersWindow(
          ui,
          document.body.offsetWidth - 280,
          120,
          220,
          196,
        );
        this.layersWindow.window.addListener("show", function () {
          ui.fireEvent(new m.mxEventObject("layers"));
        });
        this.layersWindow.window.addListener("hide", function () {
          ui.fireEvent(new m.mxEventObject("layers"));
        });
        this.layersWindow.window.setVisible(true);
        ui.fireEvent(new m.mxEventObject("layers"));

        this.layersWindow.init();
      } else {
        this.layersWindow.window.setVisible(
          !this.layersWindow.window.isVisible(),
        );
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+Shift+L",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(
    m.mxUtils.bind(this, function () {
      return this.layersWindow != null && this.layersWindow.window.isVisible();
    }),
  );
  action = this.addAction(
    "formatPanel",
    m.mxUtils.bind(this, function () {
      ui.toggleFormatPanel();
    }),
    null,
    null,
    Editor.ctrlKey + "+Shift+P",
  );
  action.setToggleAction(true);
  action.setSelectedCallback(
    m.mxUtils.bind(this, function () {
      return ui.formatWidth > 0;
    }),
  );
  action = this.addAction(
    "outline",
    m.mxUtils.bind(this, function () {
      if (this.outlineWindow == null) {
        // LATER: Check layers window for initial placement
        this.outlineWindow = new OutlineWindow(
          ui,
          document.body.offsetWidth - 260,
          100,
          180,
          180,
        );
        this.outlineWindow.window.addListener("show", function () {
          ui.fireEvent(new m.mxEventObject("outline"));
        });
        this.outlineWindow.window.addListener("hide", function () {
          ui.fireEvent(new m.mxEventObject("outline"));
        });
        this.outlineWindow.window.setVisible(true);
        ui.fireEvent(new m.mxEventObject("outline"));
      } else {
        this.outlineWindow.window.setVisible(
          !this.outlineWindow.window.isVisible(),
        );
      }
    }),
    null,
    null,
    Editor.ctrlKey + "+Shift+O",
  );

  action.setToggleAction(true);
  action.setSelectedCallback(
    m.mxUtils.bind(this, function () {
      return (
        this.outlineWindow != null && this.outlineWindow.window.isVisible()
      );
    }),
  );
};

/**
 * Registers the given action under the given name.
 */
Actions.prototype.addAction = function (
  key,
  funct,
  enabled,
  iconCls,
  shortcut,
) {
  var title;

  if (key.substring(key.length - 3) == "...") {
    key = key.substring(0, key.length - 3);
    title = m.mxResources.get(key) + "...";
  } else {
    title = m.mxResources.get(key);
  }

  return this.put(key, new Action(title, funct, enabled, iconCls, shortcut));
};

/**
 * Registers the given action under the given name.
 */
Actions.prototype.put = function (name, action) {
  this.actions[name] = action;

  return action;
};

/**
 * Returns the action for the given name or null if no such action exists.
 */
Actions.prototype.get = function (name) {
  return this.actions[name];
};

/**
 * Constructs a new action for the given parameters.
 */
/*
function Action(label, funct, enabled, iconCls, shortcut) {
  m.mxEventSource.call(this);
  this.label = label;
  this.funct = this.createFunction(funct);
  this.enabled = enabled != null ? enabled : true;
  this.iconCls = iconCls;
  this.shortcut = shortcut;
  this.visible = true;
}
*/
export class Action extends m.mxEventSource {
  constructor(label, funct, enabled, iconCls, shortcut) {
    super();
    this.label = label;
    this.funct = this.createFunction(funct);
    this.enabled = enabled != null ? enabled : true;
    this.iconCls = iconCls;
    this.shortcut = shortcut;
    this.visible = true;
  }
} //class end

// Action inherits from mxEventSource
//m.mxUtils.extend(Action, m.mxEventSource);

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.createFunction = function (funct) {
  return funct;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setEnabled = function (value) {
  if (this.enabled != value) {
    this.enabled = value;
    this.fireEvent(new m.mxEventObject("stateChanged"));
  }
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.isEnabled = function () {
  return this.enabled;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setToggleAction = function (value) {
  this.toggleAction = value;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.setSelectedCallback = function (funct) {
  this.selectedCallback = funct;
};

/**
 * Sets the enabled state of the action and fires a stateChanged event.
 */
Action.prototype.isSelected = function () {
  return this.selectedCallback();
};
