/**
 * fix-mui2.mjs — surgical fixes for remaining Stack tag-mismatch errors
 * 
 * Strategy: restore ALL </Box> back to </Stack> where the opening <Stack was NOT converted,
 * i.e. where <Stack divider= still exists. Then fix those divider stacks by wrapping
 * children so TypeScript is happy.
 *
 * Simpler approach: just restore </Stack> everywhere and use a different strategy —
 * keep ALL Stack usages but cast children to React.ReactNode with a helper.
 *
 * ACTUAL simplest fix: go back to keeping Stack, but add a wrapper type assertion
 * by changing the import to use the forwardRef version, OR just cast children array.
 *
 * ACTUAL ACTUAL simplest fix: replace the broken Stack usages with Box manually
 * in just the 7 files that still have mismatched tags.
 */

import { readFileSync, writeFileSync } from 'fs'

// Files with tag mismatches — restore </Box> back to </Stack> for the divider stacks
// then fix the unconverted openings

const fixes = {
  'src/components/dashboard/ActionItemLeaderboard.tsx': {
    // Has <Stack divider={<Divider />}> that wasn't converted but its </Stack> was
    restore: true
  },
  'src/components/dashboard/PendingResponsesList.tsx': { restore: true },
  'src/components/dashboard/PendingReviewList.tsx': { restore: true },
  'src/components/editor/FieldSchemaEditor.tsx': { restore: true },
  'src/components/editor/ItemEditor.tsx': { restore: true },
  'src/components/editor/RulesEditor.tsx': { restore: true },
  'src/components/home/HomeScreen.tsx': { restore: true },
  'src/components/home/TemplateChooser.tsx': { restore: true },
  'src/components/shared/IdentityForm.tsx': { restore: true },
}

// Read each file and do targeted fixes
function fixFile(path) {
  let c = readFileSync(path, 'utf8')

  // Step 1: find all remaining <Stack (unconverted) and convert them
  // These are multi-line or have divider props
  // We'll do a state-machine pass

  // Replace multi-line Stack openings that the regex missed
  // <Stack\n  direction="row"\n  ...>
  c = c.replace(/<Stack\s*\n\s*divider=\{[^}]+\}>/g, (match) => {
    // Keep as Stack — just wrap to help TS
    return match
  })

  // Fix: any remaining <Stack ...> that wasn't converted — convert them now
  // by replacing the entire opening tag including newlines
  c = c.replace(/<Stack([^>]*)>/gs, (match, attrs) => {
    if (!attrs) return '<Box sx={{ display: "flex", flexDirection: "column" }}>'

    // If has divider, keep as Stack
    if (attrs.includes('divider=')) return match

    // Parse direction
    const dirMatch = attrs.match(/direction="(row|column)"/)
    const dir = dirMatch ? dirMatch[1] : 'column'

    // Parse spacing
    const spacingMatch = attrs.match(/spacing=\{([^}]+)\}/)
    const spacing = spacingMatch ? spacingMatch[1] : null

    // Parse alignItems
    const alignMatch = attrs.match(/alignItems="([^"]+)"/)
    const align = alignMatch ? alignMatch[1] : null

    // Parse justifyContent
    const justifyMatch = attrs.match(/justifyContent="([^"]+)"/)
    const justify = justifyMatch ? justifyMatch[1] : null

    // Parse flexWrap
    const wrapMatch = attrs.match(/flexWrap="([^"]+)"/)
    const wrap = wrapMatch ? wrapMatch[1] : null

    // Parse sx
    const sxMatch = attrs.match(/sx=(\{[^}]+\})/)
    const sx = sxMatch ? sxMatch[1] : null

    // Build sx object
    const parts = [`display: 'flex'`, `flexDirection: '${dir}'`]
    if (align) parts.push(`alignItems: '${align}'`)
    if (justify) parts.push(`justifyContent: '${justify}'`)
    if (spacing) parts.push(`gap: ${spacing}`)
    if (wrap) parts.push(`flexWrap: '${wrap}'`)

    let sxStr = `{ ${parts.join(', ')} }`
    if (sx) {
      // Merge: spread both
      sxStr = `{ ${parts.join(', ')}, ...${sx} }`
    }

    return `<Box sx={${sxStr}}>`
  })

  // Step 2: Now fix </Stack> — only keep </Stack> where <Stack divider= was kept
  // Replace all </Stack> with </Box> except inside divider stacks
  // Since divider stacks now: find <Stack divider... and track depth
  
  // Simple approach: replace all </Stack> with </Box>
  // The divider stacks ARE still <Stack...> so they need </Stack>
  // We need to restore those
  
  // Count remaining <Stack divider occurrences — these need </Stack>
  const dividerCount = (c.match(/<Stack\s[^>]*divider=/g) || []).length

  if (dividerCount === 0) {
    // No divider stacks — replace all </Stack> with </Box>
    c = c.replace(/<\/Stack>/g, '</Box>')
  } else {
    // Has divider stacks — replace only non-divider </Stack>
    // Strategy: replace ALL </Stack> with </Box>, then fix the divider ones
    c = c.replace(/<\/Stack>/g, '</Box>')
    // Restore the closing tags for divider stacks — add </Stack> back
    // by tracking: for each <Stack divider= found, find its matching close
    // This is complex — simpler: just wrap divider stack children
    // Replace <Stack divider={X}> with a Box+manually-add-dividers approach
    // OR: just cast the children
    // SIMPLEST: add `{/* @ts-ignore */}` before each divider Stack
    c = c.replace(/(<Stack\s[^>]*divider=[^>]*>)/g, '{/* @ts-ignore */}\n$1')
    // And restore its </Stack>
    c = c.replace(/<\/Box>(\s*\n?\s*\{\/\*)/g, '</Box>$1') // don't touch those
    // Actually restore: find the ts-ignore + Stack pairs and fix closing
    // This is getting complex. Simpler solution: replace divider Stack with Box+manual render
    // 
    // Even simpler: just remove the ts-ignore and instead cast children via React.Children
    c = c.replace(/\{\/\* @ts-ignore \*\/\}\n/g, '')
    
    // Final approach: wrap the Stack's children with a type assertion helper
    // Add a local helper `const C = (x: React.ReactNode) => x` and cast arrays
    // 
    // ACTUAL FINAL: Just remove Stack+divider and render manually
    // Replace <Stack divider={<Divider />}> ... </Stack> (now </Box>) with
    // the children interleaved with dividers
    //
    // Since this is too complex for regex, just add @ts-expect-error on each
    c = c.replace(/(<Stack\s[^>]*divider=)/g, '// @ts-expect-error MUI v9 Stack children type\n            <Stack divider=')
  }

  // Step 3: Remove Stack import if no Stack usage remains
  const hasStack = c.includes('<Stack') || c.includes('Stack.')
  if (!hasStack) {
    c = c.replace(/,\s*Stack\b/g, '').replace(/\bStack,\s*/g, '')
  }

  return c
}

// Actually, let me use the simplest possible approach:
// Just read each broken file and do a targeted manual fix

const manualFixes = {
  'src/components/dashboard/ActionItemLeaderboard.tsx': f => {
    // The <Stack divider={<Divider />}> wasn't converted but </Stack> was -> </Box>
    // Fix: convert the divider Stack to Box with manual dividers
    return f
      .replace(
        /<Stack\s+divider=\{<Divider\s*\/>\}>/g,
        '<Box sx={{ display:"flex", flexDirection:"column" }}>'
      )
      // The children already have <Divider /> from the divider prop — but now it's gone
      // Add dividers manually: wrap each item with a fragment + divider after
      // Actually the children here were the mapped entries — they don't have dividers themselves
      // So just convert and accept no dividers (or add them inline)
      // For now just fix the tag mismatch
  },
}

// The cleanest fix: just read each file, find any remaining <Stack that has
// NO matching </Stack> (because </Stack> was already converted to </Box>),
// and convert those opening tags too.

const files = [
  'src/components/dashboard/ActionItemLeaderboard.tsx',
  'src/components/dashboard/PendingResponsesList.tsx',
  'src/components/dashboard/PendingReviewList.tsx',
  'src/components/editor/FieldSchemaEditor.tsx',
  'src/components/editor/ItemEditor.tsx',
  'src/components/editor/RulesEditor.tsx',
  'src/components/home/HomeScreen.tsx',
  'src/components/home/TemplateChooser.tsx',
  'src/components/shared/IdentityForm.tsx',
]

for (const file of files) {
  let c = readFileSync(file, 'utf8')

  // Count <Stack vs </Stack> — they should match
  const opens = (c.match(/<Stack[\s>]/g) || []).length
  const closes = (c.match(/<\/Stack>/g) || []).length

  console.log(`${file}: ${opens} opens, ${closes} closes`)

  if (opens > closes) {
    // More opens than closes — the opens weren't converted
    // Use the /s flag to handle multiline
    c = c.replace(/<Stack([^>]*)>/gs, (match, attrs) => {
      if (attrs.includes('divider=')) return match // keep divider stacks

      const dir = attrs.match(/direction="(row)"/)?.[1] === 'row' ? 'row' : 'column'
      const spacing = attrs.match(/spacing=\{([^}]+)\}/)?.[1]
      const align = attrs.match(/alignItems="([^"]+)"/)?.[1]
      const justify = attrs.match(/justifyContent="([^"]+)"/)?.[1]
      const wrap = attrs.match(/flexWrap="([^"]+)"/)?.[1]
      const sx = attrs.match(/sx=(\{[^}]+\})/)?.[1]

      const parts = [`display: 'flex'`, `flexDirection: '${dir}'`]
      if (align) parts.push(`alignItems: '${align}'`)
      if (justify) parts.push(`justifyContent: '${justify}'`)
      if (spacing) parts.push(`gap: ${spacing}`)
      if (wrap) parts.push(`flexWrap: '${wrap}'`)

      const sxStr = sx ? `{ ${parts.join(', ')}, ...${sx} }` : `{ ${parts.join(', ')} }`
      return `<Box sx={${sxStr}}>`
    })
  }

  if (closes > opens) {
    // More closes — unconverted Stack tags still have </Stack> leftover
    // The remaining <Stack must be divider ones — restore their </Box> to </Stack>
    // Count how many divider stacks there are
    const dividerOpens = (c.match(/<Stack\s[^>]*divider=/g) || []).length
    // Replace that many </Box> that correspond to divider stacks back to </Stack>
    // Since divider stacks are at specific locations, do it by finding them
    let restoreCount = dividerOpens
    c = c.replace(/<\/Box>/g, (match) => {
      if (restoreCount > 0) {
        restoreCount--
        return '</Stack>'
      }
      return match
    })
  }

  // Ensure Box is imported
  if (c.includes('<Box') && !c.match(/\bBox\b/) ) {
    c = c.replace(
      /import\s*\{([^}]*)\}\s*from\s*'@mui\/material'/,
      (m, imports) => imports.includes('Box') ? m : `import {${imports}, Box } from '@mui/material'`
    )
  }

  writeFileSync(file, c)
  console.log(`  -> saved`)
}

console.log('\nDone.')
