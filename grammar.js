module.exports = grammar({
  name: 'jcl',

  extras: $ => [
    /\s/,
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.job_statement,
      $.exec_statement,
      $.dd_statement,
      $.comment,
      $.proc_statement,
      $.pend_statement,
      $.if_statement,
      $.else_statement,
      $.endif_statement,
      $.set_statement,
      $.include_statement,
      $.jcllib_statement
    ),

    // JOB Statement
    job_statement: $ => seq(
      $.label,
      'JOB',
      optional(choice(
        $.accounting_info,
        $.parameter_list
      ))
    ),

    // EXEC Statement
    exec_statement: $ => seq(
      $.label,
      'EXEC',
      choice(
        seq('PGM=', $.program_name),
        seq('PROC=', $.proc_name),
        $.proc_name
      ),
      optional($.parameter_list)
    ),

    // DD Statement
    dd_statement: $ => seq(
      $.label,
      'DD',
      optional(choice(
        'DUMMY',
        '*',  // Inline data
        $.parameter_list
      )),
      optional($.inline_data)
    ),

    // PROC Statement
    proc_statement: $ => seq(
      $.label,
      'PROC',
      optional($.parameter_list)
    ),

    // PEND Statement
    pend_statement: $ => seq(
      $.label,
      'PEND'
    ),

    // IF Statement
    if_statement: $ => seq(
      $.label,
      'IF',
      $.condition
    ),

    // ELSE Statement
    else_statement: $ => seq(
      $.label,
      'ELSE'
    ),

    // ENDIF Statement
    endif_statement: $ => seq(
      $.label,
      'ENDIF'
    ),

    // SET Statement
    set_statement: $ => seq(
      $.label,
      'SET',
      $.symbol_assignment
    ),

    // INCLUDE Statement
    include_statement: $ => seq(
      $.label,
      'INCLUDE',
      'MEMBER=',
      $.member_name
    ),

    // JCLLIB Statement
    jcllib_statement: $ => seq(
      $.label,
      'JCLLIB',
      'ORDER=',
      $.library_list
    ),

    // Comment
    comment: $ => /\/\/\*.*/,

    // Label (job name, step name, DD name, etc.)
    label: $ => seq(
      '//',
      $.name
    ),

    // Basic identifiers
    name: $ => /[A-Z][A-Z0-9#@$]{0,7}/,
    
    program_name: $ => /[A-Z][A-Z0-9#@$]{0,7}/,
    
    proc_name: $ => /[A-Z][A-Z0-9#@$]{0,7}/,
    
    member_name: $ => /[A-Z][A-Z0-9#@$]{0,7}/,
    
    dataset_name: $ => choice(
      // Simple dataset name
      /[A-Z][A-Z0-9]*(\.[A-Z][A-Z0-9]*)*/,
      // Dataset with member
      seq(
        /[A-Z][A-Z0-9]*(\.[A-Z][A-Z0-9]*)*/,
        '(',
        $.member_name,
        ')'
      ),
      // Temporary dataset
      /&&[A-Z][A-Z0-9]*/,
      // Referback
      /\*\.[A-Z][A-Z0-9]*(\.[A-Z][A-Z0-9]*)*/
    ),

    // Parameters
    parameter_list: $ => repeat1(choice(
      $.parameter,
      seq(',', $.parameter)
    )),

    accounting_info: $ => seq(
      '(',
      /[^)]+/,
      ')',
      optional(seq(',', $.quoted_string))
    ),

    parameter: $ => choice(
      // Keyword=value parameter
      seq($.keyword, '=', $.parameter_value),
      // Positional parameter
      $.parameter_value
    ),

    keyword: $ => /[A-Z]+/,

    parameter_value: $ => choice(
      $.simple_value,
      $.quoted_string,
      $.subparameter_list
    ),

    simple_value: $ => /[A-Z0-9#@$&*]+/,

    quoted_string: $ => /\'[^\']*\'/,

    subparameter_list: $ => seq(
      '(',
      $.subparameter,
      repeat(seq(',', $.subparameter)),
      ')'
    ),

    subparameter: $ => choice(
      $.simple_value,
      $.quoted_string,
      seq($.keyword, '=', $.simple_value)
    ),

    // Inline data
    inline_data: $ => seq(
      /\n/,
      repeat(/[^\n]+\n/),
      '/*'
    ),

    // Conditions for IF statements
    condition: $ => choice(
      // RC condition
      seq('RC', $.comparison_operator, $.number),
      // ABEND condition
      seq('ABEND', '=', choice('TRUE', 'FALSE')),
      // Complex condition
      seq('(', $.condition, ')', optional(seq($.logical_operator, $.condition)))
    ),

    comparison_operator: $ => choice('=', '!=', '<', '>', '<=', '>=', 'EQ', 'NE', 'LT', 'GT', 'LE', 'GE'),

    logical_operator: $ => choice('AND', 'OR', '&', '|'),

    number: $ => /\d+/,

    // Symbol assignment for SET
    symbol_assignment: $ => seq(
      $.symbol_name,
      '=',
      $.symbol_value
    ),

    symbol_name: $ => /&[A-Z][A-Z0-9]*/,

    symbol_value: $ => choice(
      $.quoted_string,
      $.simple_value,
      $.symbol_name
    ),

    // Library list for JCLLIB
    library_list: $ => choice(
      $.dataset_name,
      seq('(', $.dataset_name, repeat(seq(',', $.dataset_name)), ')')
    ),

    // Continuation handling
    continuation: $ => seq(
      /\n/,
      '//',
      repeat(' '),
      $.parameter
    ),
  }
});