<?php

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$config = new Config();

$rules = [
    '@PSR12'                      => true,
    'array_indentation'           => true,
    'blank_line_before_statement' => [
        'statements' => [
            'if',
            'for',
            'foreach',
            'break',
            'continue',
            'declare',
            'return',
            'throw',
            'try',
            'switch',
        ],
    ],
    'single_quote'           => true,
    'binary_operator_spaces' => [
        'operators' => [
            '='  => 'align_single_space_minimal',
            '=>' => 'align_single_space_minimal',
        ],
    ],
    'phpdoc_add_missing_param_annotation' => [
        'only_untyped' => false,
    ],
    'object_operator_without_whitespace' => true,
    'phpdoc_align'                       => true,
    'phpdoc_line_span'                   => true,
    'no_unused_imports'                  => true,
    'heredoc_indentation'                => true,
    'no_extra_blank_lines'               => true,
    'whitespace_after_comma_in_array'    => [
        'ensure_single_space' => true,
    ],
    'concat_space'                           => ['spacing' => 'one'],
    'multiline_whitespace_before_semicolons' => false,
    'combine_consecutive_unsets'             => true,
    'switch_case_space'                      => true,
    'switch_case_semicolon_to_colon'         => true,
    'method_argument_space'                  => [
        'on_multiline'                     => 'ensure_fully_multiline',
        'keep_multiple_spaces_after_comma' => false,
    ],
    'no_trailing_comma_in_singleline_array' => true,
];

$finder = Finder::create()
    ->name('*.php')
    ->notName('*.blade.php')
    ->in(__DIR__)
    ->exclude([
        'bootstrap/cache',
        'storage',
        'vendor',
        'node_modules',
    ])
    ->ignoreDotFiles(true)
    ->ignoreVCS(true);

return $config->setRules($rules)
    ->setLineEnding("\n")
    ->setFinder($finder);
