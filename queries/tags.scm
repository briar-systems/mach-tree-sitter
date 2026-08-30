(function_declaration
  name: (identifier) @name) @definition.function

(struct_definition 
  name: (type_identifier) @name) @definition.struct

(type_definition 
  name: (type_identifier) @name) @definition.type

(global_variable_declaration
  (variable_declaration
    (variable_identifier_declaration
      name: (identifier) @definition.constant)))
