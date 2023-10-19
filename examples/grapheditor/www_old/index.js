import * as m from "../../../../dist/mxgraph.es.js";
import { Actions } from "./js/Actions.js";
//import {Dialogs}  from "./js/Dialogs.js";
import { Editor } from "./js/Editor.js";
import { EditorUi } from "./js/EditorUi.js";
import { Format } from "./js/Format.js";
import { Graph } from "./js/Graph.js";
import { Menus } from "./js/Menus.js";
//import * as s   from "./js/Shapes.js";
import { Sidebar } from "./js/Sidebar.js";
import { Toolbar } from "./js/Toolbar.js";
import  SplitView  from "./js/SplitViewClass.js";
//import    "./js/SplitView.css";
import * as s from "./js/Shapes.js";


var mxBasePath = "../../../dist";
let OPEN_URL = "/examples/grapheditor/www";
var IMAGE_PATH = 'images';

var urlParams = (function (url) {
  var result = new Object();
  var idx = url.lastIndexOf("?");

  if (idx > 0) {
    var params = url.substring(idx + 1).split("&");

    for (var i = 0; i < params.length; i++) {
      idx = params[i].indexOf("=");

      if (idx > 0) {
        result[params[i].substring(0, idx)] = params[i].substring(idx + 1);
      }
    }
  }

  return result;
})(window.location.href);

var mxLoadResources = false;

window.addEventListener('DOMContentLoaded', init());
 

function init () {

  let editorUiInit = EditorUi.prototype.init;

  EditorUi.prototype.init = function () {
    editorUiInit.apply(this, arguments);
    this.actions.get("export").setEnabled(false);

    // Updates action states which require a backend
    if (!Editor.useLocalStorage) {
      m.mxUtils.post(
        OPEN_URL,
        "",
        m.mxUtils.bind(this, function (req) {
          var enabled = req.getStatus() != 404;
          this.actions.get("open").setEnabled(enabled || Graph.fileSupport);
          this.actions.get("import").setEnabled(enabled || Graph.fileSupport);
          this.actions.get("save").setEnabled(enabled);
          this.actions.get("saveAs").setEnabled(enabled);
          this.actions.get("export").setEnabled(enabled);
        }),
      );
    }
  };

  // Adds required resources (disables loading of fallback properties, this can only
  // be used if we know that all keys are defined in the language specific file)
  m.mxResources.loadDefaultBundle = false;
  var bundle =
    m.mxResources.getDefaultBundle(RESOURCE_BASE, m.mxLanguage) ||
    m.mxResources.getSpecialBundle(RESOURCE_BASE, m.mxLanguage);

  //let splitview = new SplitView();

  //  splitview.activate(document.getElementById("splitview"));

  // Fixes possible asynchronous requests
  
  m.mxUtils.getAll(
    [bundle, STYLE_PATH + "/default.xml"],
    function (xhr) {
      // Adds bundle text to resources
      m.mxResources.parse(xhr[0].getText());

      // Configures the default graph theme
      var themes = new Object();
      themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();

      // Main
      new EditorUi(new Editor(urlParams["chrome"] == "0", themes), 
	      document.getElementById("main"));
    },
    function () {
      document.body.innerHTML =
        '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
    },
  );
  

};

/*
(function(){
    window.global_a = "WINDOW GGGGG"; // 『var』を抜いて定義します。
})();
    var global_a = "GGGGG"; // 『var』を抜いて定義します。
 
console.log(global_a); 
console.log(window["global_a"]); 

*/
