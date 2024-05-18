import colors from "colors/safe.js";
import { nodes } from "./parser.mjs";

colors.setTheme({
  string: "green",
  bool: "yellow",
  number: "yellow",
  null: "cyan",
  node_name: "white",
  error: "red",
});
const members = ["blue", "white", "magenta", "green"];

const tab_cache = [];
const tabulate = (ind) => {
  if (tab_cache.length < ind - 1) return tab_cache[ind - 1];

  let tabs = "";
  for (let tab = 0; tab < ind; tab += 1) tabs += "  ";
  tab_cache[ind - 1] = tabs;

  return tabs;
};

const member_color = (tab_ind, message) => {
  return colors[members[tab_ind % members.length]](message);
};

/*
function deep_log_function(node, tab_ind) {
  //prettier-ignore
  let output =
`${tabulate(tab_ind) + member_color(tab_ind, "Args:")}
`;
  for (let arg of node.args) {
    output += deep_log_ast_node(arg, tab_ind + 1) + "\n";
  }

  //prettier-ignore
  output += deep_log_ast_node(node.block, tab_ind, "Block")
  return output;
}
function deep_log_ast_node(node, tab_ind = 0, expected = null) {
  const this_tab = tabulate(tab_ind);
  const next_tab = tabulate(tab_ind + 1);

  if (node instanceof nodes.Block) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "Block:")}`;

    for (let statement of node.nodes) {
      output += "\n" + deep_log_ast_node(statement, tab_ind + 1);
    }

    return output;
  }
  if (node instanceof nodes.Class) {
    //prettier-ignore
    let output =
`${tabulate(tab_ind) + member_color(tab_ind, "Class:")}
${deep_log_ast_node(node.constructor_, tab_ind + 1)}
${next_tab + member_color(tab_ind + 1, "Members:")}
`
    for (let member of node.members) {
      output += deep_log_ast_node(member, tab_ind + 2) + "\n";
    }

    output += `${next_tab + member_color(tab_ind + 1, "Methods:")}`;
    for (let method of node.methods) {
      output += deep_log_ast_node(method, tab_ind + 2) + "\n";
    }

    return output;
  }
  if (node instanceof nodes.Class_Constructor) {
    //prettier-ignore
    let output =
`${this_tab + member_color(tab_ind, "Constructor:")}
${deep_log_function(node, tab_ind + 1)}`
    return output;
  }
  if (node instanceof nodes.Class_Member) {
    //prettier-ignore
    let output =
`${this_tab + member_color(tab_ind, "Member:")}
${next_tab + member_color(tab_ind + 1, "Static: ") + colors.bool(node.static_)}
${next_tab + member_color(tab_ind + 1, "Name: ") + node.name}
${next_tab + member_color(tab_ind + 1, "Value:") }
${deep_log_ast_node(node.value, tab_ind + 2)}`
    return output;
  }

  if (node instanceof nodes.Definition) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "Definition:")}
${next_tab + member_color(tab_ind + 1, "Type:")} ${node.type}
${next_tab + member_color(tab_ind + 1, "Name:")} ${node.name}
${next_tab + member_color(tab_ind + 1, "Value:")}
${deep_log_ast_node(node.value, tab_ind + 2)}`;

    return output;
  }
  if (node instanceof nodes.Function_Arg) {
    let output = `${this_tab + member_color(tab_ind, "Function Arg:")}
${next_tab + member_color(tab_ind + 1, "Name: ")} ${node.name}
${next_tab + member_color(tab_ind + 1, "Default:")}
${deep_log_ast_node(node.default, tab_ind + 2)}`;
    return output;
  }

  if (node instanceof nodes.For) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "For:")}
${next_tab + member_color(tab_ind + 1, "Initialization:")}
${deep_log_ast_node(node.initialization, tab_ind + 2)}
${next_tab + member_color(tab_ind + 1, "Condition:")}
${deep_log_ast_node(node.condition, tab_ind + 2)}
${next_tab + member_color(tab_ind + 1, "Iteration:")}
${deep_log_ast_node(node.iteration, tab_ind + 2)}
${deep_log_ast_node(node.block, tab_ind + 1)}`;

    return output;
  }
  if (node instanceof nodes.While) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "While:")}
${next_tab + member_color(tab_ind + 1, "Condition:")}
${deep_log_ast_node(node.condition, tab_ind + 2)}
${deep_log_ast_node(node.block, tab_ind + 1)}
`;

    return output;
  }
  if (node instanceof nodes.Function) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "Function:")}
${next_tab + member_color(tab_ind + 1, "Name:")} ${node.name}
${deep_log_function(node, tab_ind + 1)}
`;

    return output;
  }
  if (node instanceof nodes.Switch) {
    //prettier-ignore
    let output =
`${this_tab + member_color(tab_ind, "Switch:")}`
    return output;
  }

  if (node instanceof nodes.If_Else) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "If Then:")}
${deep_log_ast_node(node.if, tab_ind + 1, "If")}`;

    for (let elif of node.elif) {
      output += "\n" + deep_log_ast_node(elif, tab_ind + 1, "Elif");
    }

    if (node.else != null) {
      output += "\n" + deep_log_ast_node(node.else, tab_ind + 1, "Else");
    }

    return output;
  }
  if (node instanceof nodes.If) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "If:")}
${deep_log_ast_node(node.condition, tab_ind + 1)}
${deep_log_ast_node(node.block, tab_ind + 1)}`;

    return output;
  }
  if (node instanceof nodes.Elif) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "Elif:")}
${deep_log_ast_node(node.condition, tab_ind + 1)}
${deep_log_ast_node(node.block, tab_ind + 1)}`;

    return output;
  }
  if (node instanceof nodes.Else) {
    //prettier-ignore
    let output = 
`${this_tab + member_color(tab_ind, "Else:")}
${deep_log_ast_node(node.block, tab_ind + 1)}`;

    return output;
  }

  if (node == null) {
    if (expected == null) {
      return (
        tabulate(tab_ind) + colors.error("Node expected but wasn't found.")
      );
    }
    return (
      tabulate(tab_ind) +
      colors.error(`Node ${expected} expected but wasn't found.`)
    );
  }
  return (
    tabulate(tab_ind) + colors.error(`Unknown node ${node.constructor.name}`)
  );
}
*/

function deep_log_ast_node(node, tab_ind = 0) {
  const this_tab = tabulate(tab_ind);
  const next_tab = tabulate(tab_ind + 1);

  if (node == null) {
    return this_tab + colors.error(`Node expected but wasn't found.`);
  }
  if (!Object.getOwnPropertyNames(nodes).includes(node.constructor.name)) {
    return this_tab + colors.error(`Unknown node ${node.constructor.name}`);
  }

  let output = `${
    this_tab + member_color(tab_ind, `${node.constructor.name}:`)
  }`;
  let names = Object.getOwnPropertyNames(node);
  for (let name of names) {
    let prop = node[name];
    output += `\n${next_tab + member_color(tab_ind + 1, `${name}:`)}`;

    if (prop == null) {
      output += " " + colors.null("null");
      continue;
    }

    switch (prop.constructor.name) {
      case "Number":
        output += " " + colors.number(prop.toString());
        continue;
      case "String":
        output += " " + colors.string(prop);
        continue;
      case "Boolean":
        output += " " + colors.bool(prop.toString());
        continue;
      //Array
      case "Array":
        for (let node of prop) {
          output += "\n" + deep_log_ast_node(node, tab_ind + 2);
        }
        continue;
    }

    output += "\n" + deep_log_ast_node(prop, tab_ind + 2);
  }

  return output;
}

export function deep_log_ast(ast) {
  let output = deep_log_ast_node(ast);
  console.log(output);
}
