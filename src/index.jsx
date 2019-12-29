/* eslint-disable no-undef */

import React from "react";
import ReactDOM from "react-dom";
import Graphin from "@antv/graphin";
import "@antv/graphin/dist/index.css"; // 引入Graphin CSS
import Gun from "gun";

/* initialize GunDB */
var gun = Gun();
window.gun = gun;

/* Feed some data */
var g = gun.get("root").put({ name: "root", type: "none" });
g.get("ua").put({ name: "SIP User-Agent", type: "phone" });
g.get("opensips").put({ name: "OpenSIPS" });
g.get("asterisk").put({ name: "Asterisk" });
g.get("rtpengine").put({ name: "RTP:Engine" });
g.get("homer").put({ name: "HOMER" });
g.get("ua")
  .get("sip")
  .put(g.get("opensips"));
g.get("ua")
  .get("rtp")
  .put(g.get("rtpengine"));
g.get("opensips")
  .get("sip")
  .put(g.get("asterisk"));
g.get("rtpengine")
  .get("rtp")
  .put(g.get("asterisk"));
g.get("opensips")
  .get("hep-sip")
  .put(g.get("homer"));
g.get("asterisk")
  .get("hep-sip")
  .put(g.get("homer"));
g.get("rtpengine")
  .get("hep-rtcp")
  .put(g.get("homer"));
var graph = {};
window.graph = graph;

/*
let local = window.sessionStorage.getItem('peers')
  if(local) {
    var def = local;
  } else {
    var def = '"http://localhost:8080/gun"';
  }
  var peers = window.prompt('Please specify the IP of the peer you want to inspect:', def);
  sessionStorage.setItem('peers', peers);
  peers = JSON.parse(peers);
  */

var data;

const App = () => {
  return (
    <div>
      <Graphin data={data} />
    </div>
  );
};
const rootElement = document.getElementById("container");
ReactDOM.render(<App />, rootElement);

/* Depth First Search - explore all of the nodes from the given Soul
 * then update D3 data and the force-layout from the html
 */

function update() {
  console.log("updating...");
  data = graph;
  ReactDOM.render(<App />, rootElement);
}

const defaultOptions = {
  /** 节点 */
  nodeCount: 10,
  nodeType: "company"
};

var DFS = (function() {
  var stack;
  var nodes;
  var edges;
  var start;
  var u;
  var label;
  var opt = false;
  var stop = false;
  var limit = 300;

  var util = {};

  util.printMap = function(map) {
    var array = Array.from(map);
    var i = 0;
    var l = array.length;
    for (; i < l; i++) {
      console.log(array[i][1]);
    }
  };

  util.printArr = function(array) {
    var i = 0;
    var l = array.length;
    for (; i < l; i++) {
      console.log(array[i]);
    }
  };

  util.makeNodes = function(map) {
    var array = Array.from(map);
    var nodes = [];
    var i = 0;
    var l = array.length;
    for (; i < l; i++) {
      nodes.push(array[i][1]);
    }
    return nodes;
  };

  util.makeEdges = function(map) {
    var array = Array.from(map);
    var edges = [];
    var i = 0;
    var l = array.length;
    for (; i < l; i++) {
      edges.push(array[i][1]);
    }
    return edges;
  };

  var dfs = {};

  dfs.search = function(soul, lbl, lim) {
    console.log("Starting with:", soul);
    if (lbl) {
      opt = true;
    } else {
      opt = false;
    }
    if (lim) {
      limit = lim;
    }
    console.log(limit);
    label = lbl;
    start = soul;
    stack = [];
    nodes = new Map();
    edges = new Map();
    gun.get(soul).once(dfs.node);
  };

  dfs.node = function(node, key) {
    //console.log('called', key, nodes.size);
    if (!node) {
      console.error("no data:", key, node);
      dfs.back();
      return;
    }
    var soul = Gun.node.soul(node);
    if (soul == start) {
      stack.push(soul);
    }
    u = node;
    if (!opt || node[label] === undefined) {
      var tmp = { id: soul, label: key, type: node.type || "company" };
      nodes.set(soul, { id: soul, data: tmp, shape: "CircleNode", style: {} });
    } else {
      var tmp = { id: soul, label: node[label], type: node.type || "company" };
      nodes.set(soul, { id: soul, data: tmp, shape: "CircleNode", style: {} });
    }
    dfs.edge(u, edges);
  };

  dfs.edge = function(node, edges) {
    if (stop) {
      console.log("stopped");
      return;
    }
    var temp;
    var soul = Gun.node.soul(node);
    var tLabel = "none";
    var arr = Object.keys(node);
    for (var item of arr) {
      //save label if the prop meets the label
      if (item === label) {
        tLabel = node[item];
      }
      //console.log(tLabel);
      // if it's an object, then there is more
      if (typeof node[item] == "object") {
        //skip nulled items or metadata
        if (node[item] == null || item === "_") {
          continue;
        }
        if (!edges.has(soul + node[item]["#"])) {
          var temp = node[item];
          break;
        }
      }
    }
    if (temp) {
      dfs.next(temp, soul, temp["#"], tLabel);
    } else {
      if (start === soul) {
        stack.pop();
      }
      dfs.back();
    }
  };

  dfs.next = function(next, edgeS, edgeT, tLabel) {
    var v = next;
    var soul = v["#"];
    var tmp = { source: edgeS, target: edgeT, properties: [] };
    nodes.set(soul, { id: soul, label: v["#"] });
    edges.set(edgeS + edgeT, { source: edgeS, target: edgeT, data: tmp });
    stack.push(soul);
    u = v;
    if (nodes.size >= limit) {
      console.info("Reached limit");
      dfs.render();
      return;
    }
    gun.get(soul).once(dfs.node);
  };

  dfs.back = function() {
    if (!(stack.length === 0)) {
      var soul = stack.pop();
      gun.get(soul).once(dfs.node);
    } else {
      dfs.render();
    }
  };

  dfs.render = function() {
    graph.nodes = util.makeNodes(nodes);
    graph.edges = util.makeEdges(edges);
    console.log("Rendering", graph);
    update();
  };

  return dfs;
})(Gun, gun, graph, update);

var test = DFS.search("root", "name");
