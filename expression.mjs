import { lex } from "./lexer.mjs";
import { nodes } from "./parser.mjs";

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.ind = 0;
  }
  current() {
    return this.tokens[this.ind];
  }
  next() {
    this.ind += 1;
    return this.tokens[this.ind - 1];
  }
  expect(type) {
    let next = this.next();
    if (next.type != type) {
      throw new Error(
        `Expected token of type ${type} instead of token ${next.value}`
      );
    }
    return next;
  }
  at_EOF() {
    return this.current().type == "EOF";
  }
}

const LBP = {
  number: 1,
  identifier: 1,
  lparen: 11,
  lsqbracket: 11,
  increment: 10,
  decrement: 10,
  star: 9,
  slash: 9,
  plus: 8,
  minus: 8,

  question: 2,
};

const default_binop = (lbp, operator) => {
  return {
    led: (left) => {
      parser.next();
      return new nodes.BinOp(operator, left, parse_expression(lbp - 1));
    },
    lbp,
  };
};
const inc_or_dec = (inc = false) => {
  const lbp = inc ? LBP.increment : LBP.decrement;
  const op = inc ? "++" : "--";
  return {
    nud: (token) => {
      parser.next();
      let right = parse_expression(lbp);
      console.log(right);
      if (!(right instanceof nodes.Identifier)) {
        throw new Error(
          `Invalid postfix argument for ${op} operator. Did you mean to include the ${
            inc ? "increment" : "decrement"
          }?`
        );
      }
      return new nodes.UnaryOp(op, right);
    },
    led: (left) => {
      parser.next();
      if (!(left instanceof nodes.Identifier)) {
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

/**
 * In a function call i(9, a) or an array [1, 2],
 * Keep parsing arguments or elements until there are no more
 * In an array, there can be empty space between the commas, e.g.
 * [3, , , , , , , 5]
 * @param {bool} accept_empty
 * @param {number} lbp - Left binding power that we parse at
 * @return {node[]}
 */
function parse_elements(accept_empty, lbp) {
  let elements = [];
  while (true) {
    if (parser.current().type == "comma") {
      if (!accept_empty) return elements;
      //Push an empty element to the array
      elements.length = elements.length + 1;
      parser.next();
    } else {
      let expr = parse_expression(0, true);
      //No more arguments, parse_expression returned null
      if (expr == null) break;
      elements.push(expr);

      //Consume the comma after the argument if it was provided
      if (parser.current().type == "comma") parser.next();
    }
  }

  return elements;
}

/*
nud means null denotation.
led means left denotation.
lbp means left binding power
For more info, read this awesome article: https://abarker.github.io/typped/pratt_parsing_intro.html#:~:text=A%20Pratt%20parser%20recursively%20parses,are%20the%20ordered%20child%20nodes.
*/
const table = {
  number: {
    nud: (token) => {
      parser.next();
      return new nodes.Number(token.value);
    },
    lbp: LBP.number,
  },
  identifier: {
    nud: (token) => {
      parser.next();
      return new nodes.Identifier(token.value);
    },
    lbp: LBP.identifier,
  },
  lparen: {
    nud: () => {
      parser.next_token();
      let expr = parse_expression(1000);
      parser.expect("rparen");
      return expr;
    },
    led: (left) => {
      parser.next();
      const args = parse_elements(false, LBP.lparen);
      parser.expect("rparen");

      return new nodes.Function_Call(left, args);
    },
    lbp: LBP.lparen,
  },
  lsqbracket: {
    //Array
    nud: (token) => {
      parser.next();
      let elements = parse_elements(true, LBP.lsqbracket);
      parser.expect("rsqbracket");
      return new nodes.Array(elements);
    },
    led: (left) => {
      parser.next();
      let ind = parse_expression(0);
      parser.expect("rsqbracket");
      return new nodes.Array_Index(left, ind);
    },
    lbp: LBP.lsqbracket,
  },

  plus: default_binop(LBP.plus, "+"),
  minus: {
    nud: (token) => {
      parser.next();
      return new nodes.UnaryOp("-", parse_expression(1000));
    },
    ...default_binop(LBP.minus, "-"),
  },
  star: default_binop(8, "*"),
  slash: default_binop(8, "/"),

  //Ternary operation
  question: {
    led: (left) => {
      parser.next();
      let on_true = parse_expression(0);
      parser.expect("colon");
      let on_false = parse_expression(0);

      return new nodes.TernaryOp(left, on_true, on_false);
    },
    lbp: LBP.question,
  },

  decrement: inc_or_dec(false),
  increment: inc_or_dec(true),
};
/**
 * @param {number} bp - Minimum binding power of subexpression
 * @param {bool} accept_empty - Accept an empty expression? If false and we can't parse an expression, throw an error.
 * @return {node}
 */
function parse_expression(bp, accept_empty = false) {
  let curr = parser.current();
  let nud = table[curr.type]?.nud;
  if (nud == null) {
    if (accept_empty) return null;
    throw new Error(`Unexpected token ${curr.value}`);
  }

  let left = nud(curr);
  curr = parser.current();

  while (!parser.at_EOF() && table[curr.type]?.lbp > bp) {
    if (table[curr.type] == undefined) return left;

    let led = table[curr.type].led;
    if (led == undefined) return left;

    left = led(left, curr);
    curr = parser.current();
  }
  return left;
}

const tokens = lex("o()[a]()");
const parser = new Parser(tokens);
const expr = parse_expression(0);
console.log(expr);
console.log(expr.args[1]);
