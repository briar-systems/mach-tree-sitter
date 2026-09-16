// comptime intrinsics whose first operand is a type. mirrors
// comptime.intrinsic_takes_type_operand in the compiler front end, checked by
// script/mach-conformance.js against the pinned mach release
export const TYPE_OPERAND_INTRINSICS = [
    "size_of",
    "length_of",
    "align_of",
    "offset_of",
    "fields",
    "cases",
    "is_record",
    "is_union",
    "is_tag",
    "is_pointer",
    "is_secret",
    "is_integer",
    "is_float",
    "type_name",
];
