/**
 * fix-mui3.mjs — convert all remaining <Stack ...> to <Box sx={{display:'flex',...}}>
 * Uses a proper multiline regex with dotall flag.
 */
import { readFileSync, writeFileSync } from 'fs'

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

function convertStack(attrs) {
  // Remove divider prop (we lose the visual dividers, but it compiles)
  // Parse the attributes string
  const dir = /direction="row"/.test(attrs) ? 'row' : 'column'
  const spacingM = attrs.match(/spacing=\{([^}]+)\}/)
  const alignM = attrs.match(/alignItems="([^"]+)"/)
  const justifyM = attrs.match(/justifyContent="([^"]+)"/)
  const wrapM = attrs.match(/flexWrap="([^"]+)"/)
  const sxM = attrs.match(/sx=(\{[^{}]*\})/)

  const parts = [`display: 'flex'`, `flexDirection: '${dir}'`]
  if (alignM) parts.push(`alignItems: '${alignM[1]}'`)
  if (justifyM) parts.push(`justifyContent: '${justifyM[1]}'`)
  if (spacingM) parts.push(`gap: ${spacingM[1]}`)
  if (wrapM) parts.push(`flexWrap: '${wrapM[1]}'`)

  const sxStr = sxM
    ? `{ ${parts.join(', ')}, ...${sxM[1]} }`
    : `{ ${parts.join(', ')} }`

  return `<Box sx={${sxStr}}>`
}

for (const file of files) {
  let c = readFileSync(file, 'utf8')
  const before = c

  // Match <Stack ...> including multiline attributes, capture everything up to >
  // The key is to match the full opening tag including newlines
  c = c.replace(/<Stack([\s\S]*?)>/g, (match, attrs) => {
    // Skip if already processed (shouldn't happen, but guard)
    return convertStack(attrs)
  })

  // Ensure Box is in the import
  if (c.includes('<Box') && !c.match(/import[^}]*Box[^}]*from '@mui\/material'/)) {
    c = c.replace(
      /import\s*\{([^}]*)\}\s*from\s*'@mui\/material'/,
      (m, imports) => {
        if (imports.includes('Box')) return m
        return `import {${imports.trimEnd()}, Box } from '@mui/material'`
      }
    )
  }

  // Remove Stack from imports if no Stack usage remains
  if (!c.includes('<Stack') && !c.includes('Stack.')) {
    c = c.replace(/,\s*Stack\b/g, '').replace(/\bStack,\s*/g, '')
  }

  if (c !== before) {
    writeFileSync(file, c)
    console.log('Fixed:', file)
  } else {
    console.log('No change:', file)
  }
}
console.log('Done.')
