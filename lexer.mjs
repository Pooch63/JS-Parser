const keywords = {
  class: 0,
  const: 0,
  do: 0,
  else: 0,
  false: 0,
  for: 0,
  function: 0,
  if: 0,
  let: 0,
  null: 0,
  return: 0,
  static: 0,
  switch: 0,
  true: 0,
  undefined: 0,
  var: 0,
  while: 0,
};
const symbols = {
  "{": "lbracket",
  "}": "rbracket",
  "[": "lsqbracket",
  "]": "rsqbracket",
  "(": "lparen",
  ")": "rparen",
  ";": "semicolon",
  ",": "comma",
  ".": "dot",

  "*": "star",
  "/": "slash",
  "%": "percent",
  "+": "plus",
  "-": "minus",
  "<<": "bit_left_shift",
  ">>": "bit_right_shift",
  "<": "less_than",
  "<=": "less_than_or_eq",
  ">": "greater_than",
  ">=": "greater_than_or_eq",
  "==": "eq_eq",
  "===": "eq_eq_eq",
  "!=": "bang_eq",
  "!==": "bang_eq_eq",
  "&": "bit_and",
  "^": "bit_xor",
  "|": "bit_or",
  "&&": "logic_and",
  "||": "logic_or",

  "=": "equals",
  "+=": "plus_eq",
  "-=": "minus_eq",
  "*=": "mul_eq",
  "/=": "div_eq",
  "%=": "mod_eq",
  "&=": "bit_and_eq",
  "|=": "bit_or_eq",
  "^=": "bit_xor_eq",
  "<<=": "bit_left_shift_eq",
  ">>=": "bit_right_shift_eq",
  ">>>=": "bit_unsigned_right_shift_eq",

  "--": "decrement",
  "++": "increment",

  "?": "question",
  ":": "colon",
};

export function lex(source) {
  let tokens = [];

  for (let ind = 0; ind < source.length; ind += 1) {
    const char = source[ind];

    //Whitespace
    if (/\s/.test(char)) continue;

    let two = char + source[ind + 1];
    let three = two + source[ind + 2];
    let four = three + source[ind + 3];
    //Four char symbol
    if (symbols[four] != null) {
      tokens.push({ type: symbols[four], value: four });
      ind += 3;
    }
    //Three char symbol
    else if (symbols[three] != null) {
      tokens.push({ type: symbols[three], value: three });
      ind += 2;
    }
    //Two char symbol
    else if (symbols[two] != null) {
      tokens.push({ type: symbols[two], value: two });
      ind += 1;
    }
    //One char symbol
    else if (symbols[char] != null) {
      tokens.push({ type: symbols[char], value: char });
    }
    //Number
    else if (/[0-9.]/.test(char)) {
      let num = "";
      let decimal = false;
      let e = false;

      while (ind < source.length) {
        //Digit
        if (/[0-9]/.test(source[ind])) num += source[ind];
        //Decimal point
        else if (source[ind] == ".") {
          if (decimal) throw new Error(`Unexpected character "."`);
          num += source[ind];
        } else if (source[ind] == "e" && !e) num += source[ind];
        //No more characters to consume
        else break;

        ind += 1;
      }

      ind -= 1;

      tokens.push({ type: "number", value: parseFloat(num) });
    }
    //Identifier
    else if (/[a-zA-Z0-9_]/.test(char)) {
      let identifier = "";
      while (ind < source.length && /[a-zA-Z0-9_]/.test(source[ind])) {
        identifier += source[ind];
        ind += 1;
      }

      if (keywords[identifier] != null) {
        tokens.push({ type: identifier, value: identifier });
      } else tokens.push({ type: "identifier", value: identifier });

      ind -= 1;
    } else {
      throw new Error(`Unexpected character ${char}`);
    }
  }

  tokens.push({ type: "EOF", value: "end of input" });
  return tokens;
}
