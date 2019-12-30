/* eslint-disable no-undef */

import React from "react";
import ReactDOM from "react-dom";
import Gun from "gun";
import Graphin, { Utils } from "@antv/graphin";
import { Button } from "antd";
import "antd/dist/antd.css";
import "@antv/graphin/dist/index.css";

/* initialize GunDB */
var gun = Gun();
window.gun = gun;
var gunRoot = "root";

/* Feed some data */
var g = gun.get(gunRoot).put({ name: "root", type: "none" });
g.get("ua").put({ name: "SIP Caller", type: "phone" });
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

var graph = { nodes: [], edges: [] };
var layout = "grid"; // forced,grid
window.data = undefined;

const App = () => {
  const [state, setState] = React.useState({
    selected: [],
    data: window.data,
    soul: gunRoot
  });

  const { data, selected } = state;
  const graphRef = React.createRef(null);

  React.useEffect(() => {
    const { graph } = graphRef.current;
    const onNodeClick = e => {
      var selected = e.item.get("model");
      console.log("Selected", selected, window.backup);
      setState({
        ...state,
        selected: selected
      });

      console.log("expand set", selected);
      if (selected && selected.data) {
        var id = selected.data.id;
        DFS.search(id, "name");
      }
      setState({
        ...state,
        data: window.data
      });
    };
    graph.on("node:dblclick", onNodeClick);
    return () => {
      graph.off("node:dblclick", onNodeClick);
    };
  }, [state]);

  const onReset = () => {
    console.log("reset", state.soul);
    window.data = undefined;
    DFS.search(state.soul, "name");
    setState({
      ...state,
      data: window.data,
      soul: state.soul
    });
  };
  window.onReset = onReset;

  const onExpand = () => {
    console.log("expand set", selected);
    if (selected[0] && selected[0].data) {
      var id = selected[0].data.id;
      DFS.search(id, "name");
    }
    setState({
      ...state,
      data: window.data
    });
  };
  const onEdit = e => {
    setState({
      ...state,
      soul: e.target.value
    });
    DFS.search(state.soul, "name");
  };
  const onKeyPress = e => {
    if (e.key === "Enter") {
      onReset();
    }
  };
  return (
    <div className="App">
      <Button onClick={onReset} type="primary">
        Gun
      </Button>
      &nbsp;
      <input value={state.soul} onChange={onEdit} onKeyDown={onKeyPress} />
      <Graphin data={window.data} layout={{ name: layout }} ref={graphRef} />
    </div>
  );
};
// eslint-disable-next-line no-undef
const rootElement = document.getElementById("container");

ReactDOM.render(<App />, rootElement);

/* Depth First Search - explore all of the nodes from the given Soul
 * then update D3 data and the force-layout from the html
 */

function update(new_graph) {
  if (!window.data || window.data.length < 1) {
    // create
    console.log("fresh graph...", new_graph);
    window.data = new_graph;
  } else {
    // update
    const nodes = [
      ...window.data.nodes
        .concat(new_graph.nodes)
        .reduce(
          (m, o) => m.set(o.id, Object.assign(m.get(o.id) || {}, o)),
          new Map()
        )
        .values()
    ];
    const edges = [
      ...window.data.edges
        .concat(new_graph.edges)
        .reduce(
          (m, o) =>
            m.set(
              o.source + o.target,
              Object.assign(m.get(o.source + o.target) || {}, o)
            ),
          new Map()
        )
        .values()
    ];
    window.data = { nodes, edges };
    console.log("updating...", window.data);
  }
  ReactDOM.render(<App />, rootElement);
}

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
    var dots = soul.split(".");
    if (dots.length > 1) {
      console.log("nested scan");
      var nest = gun;
      var i;
      for (i = 0; i < dots.length - 1; i++) {
        nest = nest.get(dots[i]);
      }
      nest.get(dots.slice(-1)[0]).once(dfs.node);
    } else {
      gun.get(soul).once(dfs.node);
    }
  };

  dfs.node = function(node, key) {
    //console.log("called", key, nodes.size);
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
    console.log("Got Data!", graph);
    update(graph);
  };

  return dfs;
})(Gun, gun, graph, update);

DFS.search(gunRoot, "name");
