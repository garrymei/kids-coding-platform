export const BLOCK_NAMESPACE = 'kids' as const;

export type NamespacedBlockType = `${typeof BLOCK_NAMESPACE}_${string}`;

export function withNamespace(name: string): NamespacedBlockType {
  return `${BLOCK_NAMESPACE}_${name}` as NamespacedBlockType;
}

export const blockPalette = {
  control: '#6C63FF',
  variables: '#2D9CDB',
  logic: '#F2C94C',
  accents: {
    highlight: '#846BFF',
    neutral: '#E9F0FF',
  },
} as const;

export const blockCategoryLabels = {
  control: '控制',
  variables: '变量',
  logic: '运算',
} as const;
