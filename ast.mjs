export const nodes = {
  Block: class {
    nodes = [];
    /**
     * @param {node} node - Node to
     */
    push_node(node) {
      this.nodes.push(node);
    }
  },
  Chained_Definition: class {
    definitions = [];
    /**
     * @param {node.Declaration | node.Definition} definition
     */
    push_def(definition) {
      this.definitions.push(definition);
    }
  },
  Declaration: class {
    /**
     * @param {"let" | "var"} type
     * @param {string} name
     */
    constructor(type, name) {
      this.type = type;
      this.name = name;
    }
  },
  Definition: class {
    /**
     * @param {"let" | "const" | "var"} type
     * @param {string} name
     * @param {node} value
     */
    constructor(type, name, value) {
      this.type = type;
      this.name = name;
      this.value = value;
    }
  },
  While: class {
    /**
     * @param {node} condition
     * @param {nodes.Block} block
     */
    constructor(condition, block) {
      this.condition = condition;
      this.block = block;
    }
  },
  For: class {
    /**
     * @param {node} initialization
     * @param {node} condition
     * @param {node} iteration
     * @param {nodes.Block} block
     */
    constructor(initialization, condition, iteration, block) {
      this.initialization = initialization;
      this.condition = condition;
      this.iteration = iteration;
      this.block = block;
    }
  },
  Switch: class {
    expression = null;
    cases = [];
    default = null;

    /**
     * @param {node} expression
     */
    constructor(expression) {
      this.expression = expression;
    }
    push_case(expr, behavior) {
      this.cases.push([expr, behavior]);
    }
    set_default(behavior) {
      this.default = behavior;
    }
  },
  Case_Block: class {
    statements = [];
    push_statement(statement) {
      this.statements.push(statement);
    }
  },
  If: class {
    constructor(condition, block) {
      this.condition = condition;
      this.block = block;
    }
  },
  Elif: class {
    constructor(condition, block) {
      this.condition = condition;
      this.block = block;
    }
  },
  Else: class {
    constructor(block) {
      this.block = block;
    }
  },
  If_Else: class {
    if = null;
    elif = [];
    else = null;

    /**
     * @param {If} if_ - If block
     */
    set_if(if_) {
      this.if = if_;
    }
    /**
     * @param {Elif} - elif
     */
    push_elif(elif) {
      this.elif.push(elif);
    }
    /**
     * @param {Else} - else_
     */
    set_else(else_) {
      this.else = else_;
    }
  },
  Function_Arg: class {
    constructor(name, default_) {
      this.name = name;
      this.default = default_;
    }
  },
  Function: class {
    constructor(name, args, block) {
      this.name = name;
      this.args = args;
      this.block = block;
    }
  },
  Return: class {
    constructor(value) {
      this.value = value;
    }
  },
  Do_While: class {
    constructor(condition, block) {
      this.condition = condition;
      this.block = block;
    }
  },
  Class_Member: class {
    constructor(static_, name, value) {
      this.static_ = static_;
      this.name = name;
      this.value = value;
    }
  },
  Class_Method: class {
    constructor(static_, args, body) {
      this.static_ = static_;
      this.args = args;
      this.body = body;
    }
  },
  Class_Constructor: class {
    constructor(args, body) {
      this.args = args;
      this.body = body;
    }
  },
  Class: class {
    constructor(name, constructor_, methods, members) {
      this.name = name;
      this.constructor_ = constructor_;
      this.methods = methods;
      this.members = members;
    }
  },

  // Expressions
  Number: Number,
  Boolean: Boolean,
  BinOp: class {
    constructor(op, left, right) {
      this.op = op;
      this.left = left;
      this.right = right;
    }
  },
  UnaryOp: class {
    constructor(op, right) {
      this.op = op;
      this.right = right;
    }
  },
  SuffixOp: class {
    constructor(op, left) {
      this.op = op;
      this.left = left;
    }
  },
  TernaryOp: class {
    constructor(condition, on_true, on_false) {
      this.condition = condition;
      this.on_true = on_true;
      this.on_false = on_false;
    }
  },

  Identifier: class {
    /**
     * @param {string} name
     */
    constructor(name) {
      this.name = name;
    }
  },
  Function_Call: class {
    /**
     * @param {node} func
     * @param {node[]} args
     */
    constructor(func, args) {
      this.func = func;
      this.args = args;
    }
  },
  Array: Array,
  Array_Index: class {
    /**
     * @param {node} array
     * @param {node} index_expr
     */
    constructor(array, index_expr) {
      this.array = array;
      this.index_expr = index_expr;
    }
  },

  Accessor: class {
    /**
     * @param {node} left
     * @param {string} accessor
     * E.g., Accessor(Identifier("nodes"), "Accessor") means nodes.Accessor
     */
    constructor(left, accessor) {
      this.left = left;
      this.accessor = accessor;
    }
  },
  Null: class {},

  Assignment: class {
    /**
     * @param {"=" |   ""} type
     * @param {nodes.Identifier | nodes.Accessor} variable
     * @param {node} value
     */
    constructor(type, variable, value) {
      this.type = type;
      this.variable = variable;
      this.value = value;
    }
  },
};
