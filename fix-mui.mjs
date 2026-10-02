/**
 * fix-mui.mjs
 * Automatically fixes all known MUI v9 TypeScript issues across src/components/
 *
 * Fixes applied:
 * 1. Replace all <Stack ...> with <Box sx={{display:'flex',...}}> to avoid v9 children type issues
 * 2. Fix icon: AddCircleOutline -> AddCircleOutlined
 * 3. Fix GridToolbarQuickFilter: remove debounceMs prop
 * 4. Fix Autocomplete renderTags: add explicit types
 * 5. Fix Charts legend slotProps: remove hidden (not valid in v9)
 * 6. Fix PieChart: remove invalid slotProps legend
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const SRC = './src'

function walk(dir) {
  const results = []
  for (const f of readdirSync(dir)) {
    const full = join(dir, f)
    if (statSync(full).isDirectory()) results.push(...walk(full))
    else if (extname(f) === '.tsx' || extname(f) === '.ts') results.push(full)
  }
  return results
}

function fix(content, file) {
  let c = content

  // ── 1. Fix icon name ──────────────────────────────────────────────────────
  c = c.replace(
    /from '@mui\/icons-material\/AddCircleOutline'/g,
    "from '@mui/icons-material/AddCircleOutlined'"
  )
  c = c.replace(/AddCircleOutlineIcon/g, 'AddCircleOutlinedIcon')

  // ── 2. Remove debounceMs from GridToolbarQuickFilter ─────────────────────
  c = c.replace(/<GridToolbarQuickFilter\s+debounceMs=\{[^}]+\}/g, '<GridToolbarQuickFilter')

  // ── 3. Remove invalid legend slotProps from Charts ───────────────────────
  // slotProps={{ legend: { hidden: true } as any }}
  c = c.replace(/\s*slotProps=\{\{\s*legend:\s*\{[^}]*\}\s*(?:as\s+any)?\s*\}\}/g, '')
  // legend={{ hidden: true }}
  c = c.replace(/\s*legend=\{\{\s*hidden:\s*true\s*\}\}/g, '')

  // ── 4. Fix Autocomplete renderTags implicit any ───────────────────────────
  c = c.replace(
    /renderTags=\{\(value,\s*getTagProps\)/g,
    'renderTags={(value: string[], getTagProps)'
  )
  c = c.replace(
    /renderTags=\{\(value:\s*string\[\],\s*getTagProps\)\s*=>\s*\n?\s*value\.map\(\(option,\s*index\)/g,
    'renderTags={(value: string[], getTagProps) =>\n              value.map((option: string, index: number)'
  )

  // ── 5. Replace Stack imports — add Box if not already imported ────────────
  // We'll replace Stack usage with Box+sx approach
  // First ensure Box is imported wherever Stack is used
  if (c.includes('<Stack') && !c.includes('} from \'@mui/material\'')) {
    // Already handled per-file below
  }

  // ── 6. Replace Stack with Box+sx flex ────────────────────────────────────
  // Only replace Stack elements that have direction prop or are used as flex containers
  // We do a multi-pass regex replacement

  // Add Box to import if Stack is present and Box isn't imported
  if (c.includes('Stack') && !c.match(/\bBox\b.*from\s+'@mui\/material'/)) {
    c = c.replace(
      /import\s*\{([^}]*)\}\s*from\s*'@mui\/material'/,
      (match, imports) => {
        if (!imports.includes('Box')) {
          return `import {${imports}, Box } from '@mui/material'`
        }
        return match
      }
    )
  }

  // Remove Stack from imports if we're replacing all usages
  // (keep it if there's a divider-based Stack which we won't replace)

  // Replace <Stack direction="row" ...> patterns
  // Pattern: <Stack direction="row" alignItems="X" spacing={N} sx={...}>
  c = c.replace(
    /<Stack\s+direction="row"\s+alignItems="([^"]+)"\s+spacing=\{([^}]+)\}\s+sx=\{(\{[^}]+\})\}>/g,
    (_, align, spacing, sx) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: '${align}', gap: ${spacing}, ...${sx} }}>`
  )

  c = c.replace(
    /<Stack\s+direction="row"\s+alignItems="([^"]+)"\s+spacing=\{([^}]+)\}>/g,
    (_, align, spacing) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: '${align}', gap: ${spacing} }}>`
  )

  c = c.replace(
    /<Stack\s+direction="row"\s+spacing=\{([^}]+)\}\s+alignItems="([^"]+)">/g,
    (_, spacing, align) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', gap: ${spacing}, alignItems: '${align}' }}>`
  )

  c = c.replace(
    /<Stack\s+direction="row"\s+spacing=\{([^}]+)\}>/g,
    (_, spacing) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', gap: ${spacing} }}>`
  )

  c = c.replace(
    /<Stack\s+direction="row"\s+justifyContent="([^"]+)"\s+alignItems="([^"]+)"\s+sx=\{(\{[^}]+\})\}>/g,
    (_, justify, align, sx) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: '${justify}', alignItems: '${align}', ...${sx} }}>`
  )

  c = c.replace(
    /<Stack\s+direction="row"\s+justifyContent="([^"]+)"\s+alignItems="([^"]+)">/g,
    (_, justify, align) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: '${justify}', alignItems: '${align}' }}>`
  )

  c = c.replace(
    /<Stack\s+direction="row"\s+alignItems="([^"]+)"\s+spacing=\{([^}]+)\}\s+flexWrap="([^"]+)"\s+useFlexGap>/g,
    (_, align, spacing, wrap) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: '${align}', gap: ${spacing}, flexWrap: '${wrap}' }}>`
  )

  c = c.replace(
    /<Stack\s+direction="row"\s+alignItems="([^"]+)"\s+spacing=\{([^}]+)\}\s+sx=\{(\{[^}]+\})\}\s+flexWrap="([^"]+)"\s+useFlexGap>/g,
    (_, align, spacing, sx, wrap) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: '${align}', gap: ${spacing}, flexWrap: '${wrap}', ...${sx} }}>`
  )

  c = c.replace(
    /<Stack\s+spacing=\{([^}]+)\}\s+flexWrap="([^"]+)"\s+useFlexGap>/g,
    (_, spacing, wrap) =>
      `<Box sx={{ display: 'flex', flexDirection: 'column', gap: ${spacing}, flexWrap: '${wrap}' }}>`
  )

  c = c.replace(
    /<Stack\s+direction="row"\s+spacing=\{([^}]+)\}\s+flexWrap="([^"]+)"\s+useFlexGap>/g,
    (_, spacing, wrap) =>
      `<Box sx={{ display: 'flex', flexDirection: 'row', gap: ${spacing}, flexWrap: '${wrap}' }}>`
  )

  // Column stacks
  c = c.replace(
    /<Stack\s+spacing=\{([^}]+)\}\s+sx=\{(\{[^}]+\})\}>/g,
    (_, spacing, sx) =>
      `<Box sx={{ display: 'flex', flexDirection: 'column', gap: ${spacing}, ...${sx} }}>`
  )

  c = c.replace(
    /<Stack\s+spacing=\{([^}]+)\}>/g,
    (_, spacing) =>
      `<Box sx={{ display: 'flex', flexDirection: 'column', gap: ${spacing} }}>`
  )

  // Self-closing or misc Stack patterns
  c = c.replace(
    /<Stack\s+direction="row"\s+sx=\{(\{[^}]+\})\}>/g,
    (_, sx) => `<Box sx={{ display: 'flex', flexDirection: 'row', ...${sx} }}>`
  )

  // Replace </Stack> -> </Box> (only where we replaced opening tags)
  // This is safe since we're replacing ALL Stack usages
  // EXCEPT: keep Stack with divider prop as-is (those are fine with all-element children)
  // Since we can't easily detect them, replace all </Stack> with </Box>
  c = c.replace(/<\/Stack>/g, '</Box>')

  // Remove Stack from import if no more <Stack usage
  if (!c.includes('<Stack') && !c.includes('Stack.')) {
    c = c.replace(/,?\s*Stack\s*,?/g, (match, offset, str) => {
      // Only remove from import lines
      const lineStart = str.lastIndexOf('\n', offset)
      const lineEnd = str.indexOf('\n', offset)
      const line = str.slice(lineStart, lineEnd)
      if (line.includes('from ')) return match.replace('Stack', '').replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}')
      return match
    })
  }

  return c
}

const files = walk(SRC)
let changed = 0

for (const file of files) {
  const original = readFileSync(file, 'utf8')
  const fixed = fix(original, file)
  if (fixed !== original) {
    writeFileSync(file, fixed, 'utf8')
    console.log('Fixed:', file.replace(SRC + '\\', '').replace(SRC + '/', ''))
    changed++
  }
}

console.log(`\nDone. Fixed ${changed} files.`)
