module.exports = grammar({
  name: 'jcl',

  extras: $ => [
    /\s/,
  ],

  conflicts: $ => [
    [$.job_statement]
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
      optional($.quoted_string),
      repeat(seq(',', $.parameter)),
      optional(seq(',', repeat($.continuation_line)))
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
      seq($.keyword, '=', $.symbolic_parameter),
      seq($.keyword, '=', $.subparameter_list),
      // Positional parameter
      $.parameter_value,
      $.symbolic_parameter
    ),

    keyword: $ => /[A-Z]+/,

    parameter_value: $ => choice(
      $.simple_value,
      $.quoted_string
    ),

    simple_value: $ => /[A-Z0-9#@$*]+/,

    quoted_string: $ => /\'[^\']*\'/,

    symbolic_parameter: $ => /&[A-Z][A-Z0-9]*/,

    subparameter_list: $ => seq(
      '(',
      optional(seq(
        $._subparameter_item,
        repeat(seq(',', $._subparameter_item))
      )),
      ')'
    ),

    _subparameter_item: $ => choice(
      /\d+/,  // Direct number pattern
      $.simple_value,
      $.quoted_string,
      seq($.keyword, '=', choice($.simple_value, /\d+/)),
      $.subparameter_list  // Nested lists like SPACE=(CYL,(1,1),RLSE)
    ),

    subparameter: $ => $._subparameter_item,

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
    continuation_line: $ => seq(
      '//',
      /\s+/,
      repeat1(choice(
        $.parameter,
        seq(',', $.parameter)
      ))
    ),
  }
});