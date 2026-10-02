import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import { Box, Tab, Tabs } from '@mui/material'

export type Tab = 'checklist' | 'dashboard'

interface Props { active: Tab; onChange: (t: Tab) => void }

export function NavTabs({ active, onChange }: Props) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: 2.5 }}>
      <Tabs value={active} onChange={(_, v) => onChange(v)}>
        <Tab value="checklist" icon={<TableChartOutlinedIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Checklist" />
        <Tab value="dashboard" icon={<BarChartOutlinedIcon sx={{ fontSize: 15 }} />} iconPosition="start" label="Dashboard" />
      </Tabs>
    </Box>
  )
}
