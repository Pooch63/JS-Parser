import { nodes } from "./ast.mjs";

export function create_parse_expression(parser) {
  /**
   * @param {number} bp - Minimum binding power of subexpression
   * @param {bool} accept_empty - Accept an empty expression? If false and we can't parse an expression, throw an error.
   * @return {node}
   */
  function parse_expression(bp, accept_empty = false) {
    let curr = parser.current_token();
    let nud = table[curr.type]?.nud;
    console.log(curr);
    if (nud == null) {
      if (accept_empty) return null;
      throw new Error(`Unexpected token ${curr.value}`);
    }

    let left = nud(curr);
    curr = parser.current_token();

    while (!parser.at_EOF() && table[curr.type]?.lbp > bp) {
      if (table[curr.type] == undefined) return left;

      let led = table[curr.type].led;
      if (led == undefined) return left;

      left = led(left, curr);
      curr = parser.current_token();
    }
    return left;
  }

  const is_validly_assignable = (node) => {
    return node instanceof nodes.Identifier || node instanceof nodes.Accessor;
  };

  const default_binop = (lbp, operator) => {
    return {
      led: (left) => {
        parser.next_token();
        return new nodes.BinOp(operator, left, parse_expression(lbp - 1));
      },
      lbp,
    };
  };
  //Unary + or -
  const default_unary_op = (operator) => {
    return {
      nud: (token) => {
        parser.next_token();
        //The unary op applies to left parentheses and above
        //E.g., -o() is equivalent to -(o()) or -a.b is equivalent to -(a.b)
        return new nodes.UnaryOp(operator, parse_expression(LBP.lparen - 1));
      },
      ...default_binop(operator == "+" ? LBP.plus : LBP.minus, operator),
    };
  };
  const inc_or_dec = (inc = false) => {
    const lbp = inc ? LBP.increment : LBP.decrement;
    const op = inc ? "++" : "--";
    return {
      nud: (token) => {
        parser.next_token();
        let right = parse_expression(lbp);
        if (!is_validly_assignable(right)) {
          throw new Error(
            `Invalid postfix argument for ${op} operator. Did you mean to include the ${
              inc ? "increment" : "decrement"
            }?`
          );
        }
        return new nodes.UnaryOp(op, right);
      },
      led: (left) => {
        parser.next_token();
        if (!is_validly_assignable(left)) {
          throw new Error(
            `Invalid prefix argument for ${op} operator. Did you mean to include the ${
              inc ? "increment" : "decrement"
            }?`
          );
        }
        return new nodes.SuffixOp(op, left);
      },
      lbp,
    };
  };
  const assignment_op = (op) => {
    return {
      led: (left) => {
        parser.next_token();
        if (!is_validly_assignable(left)) throw new Error(`Unexpected token =`);
        let assignment = parse_expression(LBP.assignment - 1, false);
        return new nodes.Assignment(op, left, assignment);
      },
      lbp: LBP.assignment,
    };
  };

  /**
   * In a function call i(9, a) or an array [1, 2],
   * Keep parsing arguments or elements until there are no more
   * In an array, there can be empty space between the commas, e.g.
   * [3, , , , , , , 5]
   * @param {bool} accept_empty
   * @return {node[]}
   */
  function parse_elements(accept_empty) {
    let elements = [];
    while (true) {
      if (parser.current_token().type == "comma") {
        if (!accept_empty) return elements;
        //Push an empty element to the array
        elements.push(new nodes.Null());
        parser.next_token();
      } else {
        let expr = parse_expression(LBP.comma + 1, true);
        //No more arguments, parse_expression returned null
        if (expr == null) break;
        elements.push(expr);

        //Consume the comma after the argument if it was provided
        if (parser.current_token().type == "comma") parser.next_token();
      }
    }

    return elements;
  }

  const LBP = {
    number: 17,
    identifier: 17,
    undefined: 17,
    null: 17,
    bool: 17,

    dot: 16,
    lparen: 15,
    lsqbracket: 15,
    increment: 14,
    decrement: 14,

    mod: 13,
    mul: 13,
    div: 13,
    plus: 12,
    minus: 12,

    shift: 11,
    relational: 10,
    equality: 9,
    bit_and: 8,
    bit_xor: 7,
    bit_or: 6,
    logic_and: 5,
    logic_or: 4,

    question: 2,
    assignment: 2,

    comma: 1,
  };

  /*
  nud means null denotation.
  led means left denotation.
  lbp means left binding power
  For more info, read this awesome article: https://abarker.github.io/typped/pratt_parsing_intro.html#:~:text=A%20Pratt%20parser%20recursively%20parses,are%20the%20ordered%20child%20nodes.
  */
  function create_table(parser) {
    const table = {
      number: {
        nud: (token) => {
          parser.next_token();
          return new nodes.Number(token.value);
        },
        lbp: LBP.number,
      },
      identifier: {
        nud: (token) => {
          parser.next_token();
          return new nodes.Identifier(token.value);
        },
        lbp: LBP.identifier,
      },
      lparen: {
        nud: () => {
          parser.next_token();
          let expr = parse_expression(0);
          parser.expect("rparen");
          return expr;
        },
        led: (left) => {
          parser.next_token();
          const args = parse_elements(false, LBP.lparen);
          parser.expect("rparen");

          return new nodes.Function_Call(left, args);
        },
        lbp: LBP.lparen,
      },
      lsqbracket: {
        //Array
        nud: (token) => {
          parser.next_token();
          let elements = parse_elements(true, LBP.lsqbracket);
          parser.expect("rsqbracket");
          let arr = new nodes.Array();
          for (let el of elements) arr.push(el);
          return arr;
        },
        led: (left) => {
          parser.next_token();
          let ind = parse_expression(0);
          parser.expect("rsqbracket");
          return new nodes.Array_Index(left, ind);
        },
        lbp: LBP.lsqbracket,
      },

      null: {
        nud: (token) => {
          parser.next_token();
          return new nodes.Null();
        },
        lbp: LBP.null,
      },
      undefined: {
        nud: (token) => {
          parser.next_token();
          return new nodes.Null();
        },
        lbp: LBP.undefined,
      },

      true: {
        nud: (token) => {
          parser.next_token();
          return new nodes.Boolean(true);
        },
        lbp: LBP.bool,
      },
      false: {
        nud: (token) => {
          parser.next_token();
          return new nodes.Boolean(false);
        },
        lbp: LBP.bool,
      },

      dot: {
        led: (left) => {
          parser.next_token();
          let accessor = parser.expect("identifier").value;
          return new nodes.Accessor(left, accessor);
        },
        lbp: LBP.dot,
      },
      //Ternary operation
      question: {
        led: (left) => {
          parser.next_token();
          let on_true = parse_expression(0);
          parser.expect("colon");
          let on_false = parse_expression(0);

          return new nodes.TernaryOp(left, on_true, on_false);
        },
        lbp: LBP.question,
      },

      equals: assignment_op("="),
      plus_eq: assignment_op("+="),
      minus_eq: assignment_op("-="),
      mul_eq: assignment_op("*="),
      div_eq: assignment_op("/="),
      mod_eq: assignment_op("%="),
      bit_and_eq: assignment_op("&="),
      bit_or_eq: assignment_op("|="),
      bit_xor_eq: assignment_op("^="),
      bit_left_shift_eq: assignment_op("<<="),
      bit_right_shift_eq: assignment_op(">>="),
      bit_unsigned_right_shift_eq: assignment_op(">>>="),

      logic_and: default_binop(LBP.logic_and, "&&"),
      logic_or: default_binop(LBP.logic_or, "||"),
      bit_or: default_binop(LBP.bit_or, "|"),
      bit_xor: default_binop(LBP.bit_xor, "^"),
      bit_and: default_binop(LBP.bit_and, "&"),

      eq_eq: default_binop(LBP.equality, "=="),
      eq_eq_eq: default_binop(LBP.equality, "==="),
      bang_eq: default_binop(LBP.equality, "!="),
      bang_eq_eq: default_binop(LBP.equality, "!=="),
      less_than: default_binop(LBP.relational, "<"),
      less_than_or_eq: default_binop(LBP.relational, "<="),
      greater_than: default_binop(LBP.relational, ">"),
      greater_than_or_eq: default_binop(LBP.relational, ">="),
      bit_left_shift: default_binop(LBP.shift, "<<"),
      bit_right_shift: default_binop(LBP.shift, ">>"),
      bit_unsigned_right_shift: default_binop(LBP.shift, ">>>"),

      plus: default_unary_op("+"),
      minus: default_unary_op("-"),
      star: default_binop(LBP.mul, "*"),
      slash: default_binop(LBP.div, "/"),
      percent: default_binop(LBP.mod, "/"),

      decrement: inc_or_dec(false),
      increment: inc_or_dec(true),
    };
    return table;
  }

  const table = create_table(parser);

  return parse_expression;
}

// EXAMPLE:
/*
import { lex } from "./lexer.mjs";

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.ind = 0;
  }
  current_token() {
    return this.tokens[this.ind];
  }
  next_token() {
    this.ind += 1;
    return this.tokens[this.ind - 1];
  }
  expect(type) {
    let next = this.next_token();
    if (next.type != type) {
      throw new Error(
        `Expected token of type ${type} instead of token ${next.value}`
      );
    }
    return next;
  }
  at_EOF() {
    return this.current_token().type == "EOF";
  }
}

const tokens = lex("u - 9 + (u == 4 ? 6 : 89)");
const parser = new Parser(tokens);

const parse_expression = create_parse_expression(parser);

const expr = parse_expression(0);
console.log(expr);
*/
