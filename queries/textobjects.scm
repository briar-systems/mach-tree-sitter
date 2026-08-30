; function —— 'ma f' and 'mi f' select
(function_definition body: (_) @_body) @function.around
(function_definition body: (block) @function.inside)

; uni/rec
(struct_definition) @class.around
(struct_definition body: (block) @class.inside)
(union_definition) @class.around
(union_definition body: (block) @class.inside)

; Each parameter in the parameter list
; 'mi a' selects a single parameter
(parameters (identifier) @parameter.around)

(line_comment) @comment.around

