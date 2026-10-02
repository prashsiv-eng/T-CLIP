import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8', contrastText: '#fff' },
    secondary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6', contrastText: '#fff' },
    success:   { main: '#16a34a', light: '#4ade80', dark: '#15803d', contrastText: '#fff' },
    warning:   { main: '#d97706', light: '#fbbf24', dark: '#b45309', contrastText: '#fff' },
    error:     { main: '#dc2626', light: '#f87171', dark: '#b91c1c', contrastText: '#fff' },
    grey: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
      400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
      800: '#1e293b', 900: '#0f172a',
    },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569', disabled: '#94a3b8' },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 13,
    h1: { fontSize: '2rem',    fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem',  fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.1rem',  fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '0.9rem',  fontWeight: 600, lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' },
    h6: { fontSize: '0.8rem',  fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.8125rem', lineHeight: 1.5 },
    body2: { fontSize: '0.75rem',   lineHeight: 1.5 },
    caption: { fontSize: '0.6875rem', lineHeight: 1.4, color: '#64748b' },
    button: { fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  shape: { borderRadius: 6 },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0/0.05)',
    '0 1px 3px 0 rgb(0 0 0/0.07),0 1px 2px -1px rgb(0 0 0/0.07)',
    '0 4px 6px -1px rgb(0 0 0/0.07),0 2px 4px -2px rgb(0 0 0/0.07)',
    '0 10px 15px -3px rgb(0 0 0/0.07),0 4px 6px -4px rgb(0 0 0/0.07)',
    '0 20px 25px -5px rgb(0 0 0/0.07),0 8px 10px -6px rgb(0 0 0/0.07)',
    ...Array(19).fill('none'),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `,
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: '0.8125rem' },
        sizeSmall: { fontSize: '0.75rem', padding: '3px 10px' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.6875rem', fontWeight: 600, height: 20, borderRadius: 4 },
        label: { padding: '0 6px' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #e2e8f0', borderRadius: 8 },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
      },
    },
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0', borderRadius: '8px !important',
          '&:before': { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 44, padding: '0 14px', backgroundColor: '#f8fafc', borderRadius: 8 },
        content: { margin: '10px 0', '&.Mui-expanded': { margin: '10px 0' } },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: { padding: '8px 14px 14px', borderTop: '1px solid #f1f5f9' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { height: 2, borderRadius: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40, padding: '8px 16px', fontSize: '0.8125rem',
          fontWeight: 500, textTransform: 'none',
          '&.Mui-selected': { fontWeight: 600 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.05em', color: '#64748b', backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        },
        body: { fontSize: '0.8125rem', borderBottom: '1px solid #f1f5f9' },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 6, fontSize: '0.8125rem' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRadius: '0 0 0 0' } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 10 } },
    },
    MuiInputBase: {
      styleOverrides: { root: { fontSize: '0.8125rem' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': { borderColor: '#e2e8f0' },
          '&:hover fieldset': { borderColor: '#94a3b8 !important' },
        },
        notchedOutline: { borderColor: '#e2e8f0' },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8125rem',
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#f8fafc',
            fontSize: '0.6875rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b',
          },
          '& .MuiDataGrid-columnSeparator': { color: '#e2e8f0' },
          '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9', fontSize: '0.8125rem' },
          '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc' },
          '& .MuiDataGrid-row.row-pass': { backgroundColor: '#f0fdf4' },
          '& .MuiDataGrid-row.row-fail': { backgroundColor: '#fef2f2' },
          '& .MuiDataGrid-row.row-pending': { backgroundColor: '#fffbeb' },
          '& .MuiDataGrid-row.row-pass:hover': { backgroundColor: '#dcfce7' },
          '& .MuiDataGrid-row.row-fail:hover': { backgroundColor: '#fee2e2' },
          '& .MuiDataGrid-row.row-pending:hover': { backgroundColor: '#fef3c7' },
          '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e2e8f0', minHeight: 44 },
          '& .MuiDataGrid-toolbarContainer': {
            padding: '8px 12px', borderBottom: '1px solid #f1f5f9', gap: 8,
          },
        },
      },
    },
  },
})
