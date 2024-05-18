import { lex } from "./lexer.mjs";
import { deep_log_ast } from "./debug.mjs";
import { nodes } from "./ast.mjs";
import { create_table } from "./expression.mjs";

class ParserScopeContext {
  constructor(async, in_class) {
    this.async = async;
    this.class = in_class;
  }

  async() {
    return this.async;
  }
  class() {
    return this.class;
  }
}
class ParserContext {
  scopes = [];

  /**
   * @return {bool} - The parser is currently in the context of an asynchronous function
   */
  async() {
    return this.scopes[this.scopes.length - 1].async();
  }
  /**
   * @return {bool} - The parser is currently in the context of a class
   */
  class() {
    return this.scopes[this.scopes.length - 1].class();
  }
  /**
   * There are certain keywords that are only reserved in certain contexts.
   * E.g., await is only registed in asynchronous functions.
   * @return {object} - Object whose keys are all the keywords we can use in this context.
   */
  accepted_registered_keywords() {
    let obj = {};
    if (!this.async()) {
      obj["await"] = 1;
    }
    if (!this.class()) {
      obj["static"] = 1;
      obj["constructor"] = 1;
    }
  }

  /**
   * Add a new scope to the context
   * @param {ParserScopeContext} scope
   */
  enter_scope(scope) {
    this.scopes.push(scope);
  }
  /**
   * Remove the current scope
   */
  exit_scope() {
    this.scopes.pop();
  }
}

class Parser {
  tokens = [];
  token_ind = 0;
  pratt_expression_table = create_table(this);

  constructor(tokens) {
    this.tokens = tokens;
  }
  next_token() {
    this.token_ind += 1;
    return this.tokens[this.token_ind - 1];
  }
  current_token() {
    return this.tokens[this.token_ind];
  }
  peek(peek_count) {
    return this.tokens[this.token_ind + peek_count];
  }
  at_EOF() {
    return (
      this.token_ind >= this.tokens.length ||
      this.current_token()?.type == "EOF"
    );
  }

  parse() {
    let tree = new nodes.Block();

    let statement = false;
    while ((statement = this.parse_statement())) {
      if (statement != null) tree.push_node(statement);
    }

    return tree;
  }
  expect(type) {
    let next = this.next_token();
    if (next.type == type) return next;

    throw new Error(
      `Unexpected token ${next.value}. Expected token of type ${type}`
    );
  }

  /**
   * @return {node | null} - Node if the parser successfully parsed a statement, null if there was a semicolon or at the end of the file.
   */
  parse_statement() {
    if (this.at_EOF()) return null;

    switch (this.current_token().type) {
      case "semicolon":
        this.next_token();
        return null;
      case "let":
      case "var":
      case "const":
        let def = this.parse_definition();
        return def;
      case "while":
        return this.parse_while();
      case "for":
        return this.parse_for();
      case "switch":
        return this.parse_switch();
      case "if":
        return this.parse_if_else_block();
      case "function":
        return this.parse_function();
      case "return":
        return this.parse_return();
      case "do":
        return this.parse_do_while();
      case "class":
        return this.parse_class();

      default:
        return this.parse_expression();
    }
  }

  parse_statement_or_scope() {
    let block;
    if (this.current_token().type == "lbracket") block = this.parse_block();
    else block = this.parse_expression();

    return block;
  }

  parse_while() {
    this.expect("while");
    this.expect("lparen");
    let condition = this.parse_expression();
    this.expect("rparen");

    let block = null;
    //They can do something like while (true); with no actual behavior
    if (this.current_token().type == "semicolon") this.expect("semicolon");
    else block = this.parse_statement_or_scope();

    return new nodes.While(condition, block);
  }
  parse_for() {
    this.expect("for");
    this.expect("lparen");

    /**
     * Parses variable definition or expression
     * @return {node} - Initialization behavior
     */
    const parse_initialization = () => {
      if (["let", "const", "var"].includes(this.current_token().type)) {
        return this.parse_definition();
      } else return this.parse_expression();
    };

    //First, parse the declaration or definition
    let initialization = null;
    if (this.current_token().type != "semicolon") {
      initialization = parse_initialization();
    }
    this.next_token();

    //Then, parse the condition
    let condition = null;
    if (this.current_token().type != "semicolon") {
      condition = this.parse_expression();
    }
    this.next_token();

    //Finally, parse the iteration statement
    let iteration = null;
    if (this.current_token().type != "rparen") {
      iteration = this.parse_expression();
    }

    this.expect("rparen");

    let block = this.parse_statement_or_scope();
    return new nodes.For(initialization, condition, iteration, block);
  }
  parse_switch() {
    this.expect("switch");

    this.expect("lparen");
    let expression = this.parse_expression();
    this.expect("rparen");

    this.expect("lbracket");

    let default_defined = false;

    /**
     * Parses case or default
     * @return {node | "default" |null} - The case expression, "default" if it was default, or null if there was no case or default
     */
    const parse_case_or_default = () => {
      if (this.current_token().type == "default") {
        if (default_defined) {
          throw new Error(`Default can only appear once in a switch statement`);
        }
        this.expect("default");
        this.expect("colon");

        return "default";
      } else if (this.current_token().type == "case") {
        this.expect("case");
        let expr = this.parse_expression();
        this.expect("colon");
        return expr;
      }
      return null;
    };
    /**
     * Parses until it sees a "case" token
     * @return {Case_Block}
     */
    const parse_until_case = () => {
      let block = new nodes.Case_Block();

      while (
        !this.at_EOF() &&
        !["case", "default", "rbracket"].includes(this.current_token().type)
      ) {
        let statement = this.parse_statement();
        if (statement != null) block.push_statement(statement);
      }

      return block;
    };

    let switch_ = new nodes.Switch(expression);
    while (this.current_token().type != "rbracket") {
      let current = this.current_token();

      switch (current.type) {
        case "case":
        case "default": {
          let cases = [];

          let case_ = null;
          while ((case_ = parse_case_or_default())) cases.push(case_);

          console.log(this.current_token().type);

          //If the next token is a }, the user didn't provide any behavior for the case, which is fine
          let behavior =
            this.current_token().type == "rbracket"
              ? null
              : //Will they do case 9: {break;} or case 9: break;
              this.current_token().type == "lbracket"
              ? this.parse_block()
              : parse_until_case();

          for (let case_ of cases) {
            if (case_ == "default") switch_.set_default(behavior);
            else switch_.push_case(case_, behavior);
          }

          break;
        }
        default:
          throw new Error(
            `Unexpected token ${current.value}. Expected token }`
          );
      }
    }

    this.expect("rbracket");

    return switch_;
  }
  parse_if_else_block() {
    let if_else = new nodes.If_Else();

    this.expect("if");
    this.expect("lparen");
    let condition = this.parse_expression();
    this.expect("rparen");

    let behavior = this.parse_statement_or_scope();
    let If = new nodes.If(condition, behavior);
    if_else.set_if(If);

    //Parse else if blocks
    while (this.current_token().type == "else" && this.peek(1).type == "if") {
      this.expect("else");
      this.expect("if");
      this.expect("lparen");
      let condition = this.parse_expression();
      this.expect("rparen");

      let behavior = this.parse_statement_or_scope();
      let elif = new nodes.Elif(condition, behavior);
      if_else.push_elif(elif);
    }

    //Parse else block
    if (this.current_token()?.type == "else") {
      this.expect("else");

      let behavior = this.parse_statement_or_scope();
      let else_ = new nodes.Else(behavior);
      if_else.set_else(else_);
    }

    return if_else;
  }
  parse_do_while() {
    this.expect("do");
    let block = this.parse_block();

    this.expect("while");
    this.expect("lparen");

    let condition = this.parse_expression();

    this.expect("rparen");
    this.expect("semicolon");

    return new nodes.Do_While(condition, block);
  }
  parse_function_args() {
    let args = [];

    while (this.current_token().type != "rparen") {
      let name = this.expect("identifier").value;
      let default_ = null;

      //They provided a default arg
      if (this.current_token().type == "equals") {
        this.expect("equals");
        default_ = this.parse_expression();
      }

      let arg = new nodes.Function_Arg(name, default_);
      args.push(arg);

      if (this.current_token().type == "comma") this.next_token();
    }
    return args;
  }
  parse_function() {
    this.expect("function");

    let name;
    if (this.current_token().type == "identifier") {
      name = this.next_token().value;
    } else name = "<anonymous>";

    this.expect("lparen");
    let args = this.parse_function_args();
    this.expect("rparen");

    let block = this.parse_block();

    return new nodes.Function(name, args, block);
  }
  parse_return() {
    this.next_token();
    return new nodes.Return(this.parse_expression());
  }
  parse_class() {
    this.expect("class");

    let name;
    if (this.current_token().type == "identifier") {
      name = this.expect("identifier").value;
    } else name = "<anonymous>";

    this.expect("lbracket");

    let methods = [];
    let constructor = null;
    let members = [];

    let static_ = false;
    while (!this.at_EOF() && this.current_token().type != "rbracket") {
      switch (this.current_token().type) {
        case "semicolon":
          this.next_token();
          break;
        case "static":
          if (static_) {
            throw new Error(`Unexpected token static`);
          }
          static_ = true;
          this.next_token();
          continue;
        //They're denoting a private variable, e.g. #o12
        case "hashtag": {
          //They only provided a hashtag, e.g. #
          if (this.current_token().value == "#") {
            if (this.peek(1) == undefined) {
              throw new Error(`Unexpected end of input.`);
            } else throw new Error(`Unexpected token ${this.peek(1).value}`);
          }
          //There is a number after the hashtag
          let first = this.current_token().value[1];
          if (/[0-9]/.test(first)) {
            throw new Error(`Unexpected character ${first}`);
          }
        }
        //Now, if it was either a hashtag or an identifier, parse the member or function
        case "identifier": {
          //Get the next token value, if it's either an identifier or a hashtag
          let name = this.next_token().value;

          //It's a method
          if (this.current_token().type == "lparen") {
            this.expect("lparen");
            let args = this.parse_function_args();
            this.expect("rparen");

            let body = this.parse_block();

            methods.push(new nodes.Class_Method(static_, args, body));
          }
          //It's a member
          else {
            if (this.current_token().type == "semicolon") {
              methods.push(new nodes.Class_Member(static_, name, null));
              break;
            }
            this.expect("equals");
            let value = this.parse_expression();

            members.push(new nodes.Class_Member(static_, name, value));
          }
          break;
        }
        case "constructor": {
          if (constructor != null) {
            throw new Error(
              `A class may not have two constructors. Unexpected token constructor`
            );
          }
          if (static_) {
            throw new Error(
              `A constructor may not be static. Unexpected token static`
            );
          }

          this.expect("constructor");
          this.expect("lparen");
          let args = this.parse_function_args();
          this.expect("rparen");

          let body = this.parse_block();
          constructor = new nodes.Class_Constructor(args, body);
          break;
        }
        default:
          throw new Error(`Unexpected token ${this.current_token().value}`);
      }
      static_ = false;
    }

    this.expect("rbracket");
    return new nodes.Class(name, constructor, methods, members);
  }

  parse_definition() {
    let type = this.next_token().type;
    let name = this.expect("identifier").value;

    if (this.current_token().type == "semicolon") {
      if (type == "const") {
        throw new Error(`A constant variable must be defined at declaration.`);
      }
      return new nodes.Declaration(type, name);
    }
    this.expect("equals");

    let value = this.parse_expression();
    let def = new nodes.Definition(type, name, value);

    if (this.current_token().type != "comma") return def;

    //User has a chained definition
    let chained = new nodes.Chained_Definition();
    chained.push_def(def);

    while (this.current_token().type == "comma") {
      this.next_token();
      let name = this.expect("identifier").value;
      if (this.current_token().type == "equals") {
        this.next_token();
        let value = this.parse_expression();
        chained.push_def(new nodes.Definition(type, name, value));
      } else chained.push_def(new nodes.Declaration(type, name));
    }

    return chained;
  }
  parse_expression() {
    return new nodes.Number(this.expect("number").value);
  }

  parse_block() {
    this.expect("lbracket");

    let block = new nodes.Block();
    while (this.current_token().type != "rbracket") {
      let statement = this.parse_statement();
      if (statement != null) block.push_node(statement);
    }

    this.expect("rbracket");

    return block;
  }
}

let tokens = lex(`
function p(u = 15) {
  return 9;
}
if (213) {}else if (8) {} else  {} 
`);
let parser = new Parser(tokens);
const ast = parser.parse();

// console.log(tokens);

// console.log(
//   util.inspect(ast, { showHidden: false, depth: null, colors: true })
// );
// deep_log_ast(ast);
