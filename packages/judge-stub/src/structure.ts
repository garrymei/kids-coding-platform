/**
 * Structure checker for code validation
 * Checks if code contains required structures like functions, classes, etc.
 */

const STRUCTURE_NAME_MAP: Record<string, string> = {
  def: '函数定义',
  class: '类定义',
  for: 'for 循环',
  while: 'while 循环',
  loop: '循环结构',
  if: '条件语句',
  import: '导入语句',
};

/**
 * Check if code contains required structures
 * @param code The code to check
 * @param requiredStructures Array of required structure types
 * @returns Object with validation results
 */
export function checkStructures(code: string, requiredStructures: string[] = []) {
  const results: Record<string, boolean> = {};

  // Check for function definitions
  if (requiredStructures.includes('def')) {
    results.def = /def\s+\w+\s*\(/.test(code);
  }

  // Check for class definitions
  if (requiredStructures.includes('class')) {
    results.class = /class\s+\w+\s*:/.test(code);
  }

  // Check for loops
  if (requiredStructures.includes('for') || requiredStructures.includes('loop')) {
    results.for = /for\s+.+ in /.test(code);
  }

  if (requiredStructures.includes('while') || requiredStructures.includes('loop')) {
    results.while = /while\s+.+:/.test(code);
  }

  // Check for conditionals
  if (requiredStructures.includes('if')) {
    results.if = /if\s+.+:/.test(code);
  }

  // Check for imports
  if (requiredStructures.includes('import')) {
    results.import = /import\s+\w+/.test(code);
  }

  return results;
}

/**
 * Validate that all required structures are present
 * @param code The code to check
 * @param requiredStructures Array of required structure types
 * @returns True if all required structures are present
 */
export function validateRequiredStructures(code: string, requiredStructures: string[] = []): boolean {
  const results = checkStructures(code, requiredStructures);

  // Check that all required structures are present
  return requiredStructures.every((structure) => {
    // Map common aliases
    const aliasMap: Record<string, string> = {
      loop: 'for', // Check for either for or while
    };

    const actualStructure = aliasMap[structure] || structure;

    // Special handling for loop (either for or while is acceptable)
    if (structure === 'loop') {
      return results.for || results.while;
    }

    return results[actualStructure] === true;
  });
}

/**
 * Get a message describing missing structures
 * @param code The code to check
 * @param requiredStructures Array of required structure types
 * @returns Message describing missing structures, or empty string if all present
 */
export function getMissingStructuresMessage(code: string, requiredStructures: string[] = []): string {
  const results = checkStructures(code, requiredStructures);

  const missing = requiredStructures.filter((structure) => {
    // Special handling for loop (either for or while is acceptable)
    if (structure === 'loop') {
      return !results.for && !results.while;
    }

    return !results[structure];
  });

  if (missing.length === 0) {
    return '';
  }

  const missingNames = missing.map((structure) => STRUCTURE_NAME_MAP[structure] || structure);

  return `缺少必需的结构：${missingNames.join(', ')}`;
}

export interface StructureValidationResult {
  valid: boolean;
  details: Record<string, boolean>;
  missing: string[];
  message: string;
}

/**
 * Validate code structure and provide details for UI consumption
 */
export function validateStructure(
  code: string,
  requiredStructures: string[] = [],
): StructureValidationResult {
  const details = checkStructures(code, requiredStructures);

  const missing = requiredStructures.filter((structure) => {
    if (structure === 'loop') {
      return !details.for && !details.while;
    }

    return details[structure] !== true;
  });

  const valid = missing.length === 0;
  const message = valid ? '' : `缺少必需的结构：${missing.map((s) => STRUCTURE_NAME_MAP[s] || s).join(', ')}`;

  return {
    valid,
    details,
    missing,
    message,
  };
}
