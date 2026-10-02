import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#2563eb', light: '#60a5fa', dark: '#1d4ed8', contrastText: '#fff' },
    secondary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6', contrastText: '#fff' },
    success:   { main: '#16a34a', light: '#4ade80', dark: '#15803d' },
    warning:   { main: '#d97706', light: '#fbbf24', dark: '#b45309' },
    error:     { main: '#dc2626', light: '#f87171', dark: '#b91c1c' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569', disabled: '#94a3b8' },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 13,
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
    body1: { fontSize: '0.8125rem' },
    body2: { fontSize: '0.75rem' },
    caption: { fontSize: '0.6875rem' },
    h5: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' },
    h6: { fontSize: '0.8125rem', fontWeight: 600 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `,
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 6 }, sizeSmall: { fontSize: '0.75rem' } },
    },
    MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #e2e8f0', borderRadius: 8 } },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: 16, '&:last-child': { paddingBottom: 16 } } },
    },
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: '8px !important',
          '&:before': { display: 'none' },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 44, px: 2, backgroundColor: '#f8fafc', borderRadius: 8 },
        content: { margin: '10px 0', '&.Mui-expanded': { margin: '10px 0' } },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: { root: { padding: '8px 14px 14px', borderTop: '1px solid #f1f5f9' } },
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
          minHeight: 40, padding: '8px 16px',
          fontSize: '0.8125rem', fontWeight: 500, textTransform: 'none',
          '&.Mui-selected': { fontWeight: 600 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.6875rem', fontWeight: 600, height: 20, borderRadius: 4 },
        label: { padding: '0 6px' },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 6, fontSize: '0.8125rem' } },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          fontSize: '0.8125rem',
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#f8fafc',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
          },
          '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9' },
          '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc !important' },
          '& .MuiDataGrid-row.row-pass': { backgroundColor: '#f0fdf4' },
          '& .MuiDataGrid-row.row-fail': { backgroundColor: '#fef2f2' },
          '& .MuiDataGrid-row.row-pending': { backgroundColor: '#ffffff' },
          '& .MuiDataGrid-row.row-pass:hover': { backgroundColor: '#dcfce7 !important' },
          '& .MuiDataGrid-row.row-fail:hover': { backgroundColor: '#fee2e2 !important' },
          '& .MuiDataGrid-row.row-pending:hover': { backgroundColor: '#f8fafc !important' },
          '& .MuiDataGrid-toolbarContainer': { padding: '8px 12px', borderBottom: '1px solid #f1f5f9', gap: '8px' },
          '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e2e8f0', minHeight: 44 },
        },
      },
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb', contrastText: '#fff' },
    secondary: { main: '#a78bfa', light: '#c4b5fd', dark: '#7c3aed', contrastText: '#fff' },
    success:   { main: '#22c55e', light: '#4ade80', dark: '#16a34a' },
    warning:   { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error:     { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f8fafc', secondary: '#94a3b8', disabled: '#64748b' },
    divider: '#334155',
  },
  typography: theme.typography,
  shape: theme.shape,
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 6 }, sizeSmall: { fontSize: '0.75rem' } },
    },
    MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #334155', borderRadius: 8 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: '#f8fafc',
          '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
          '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
        },
        input: {
          color: '#f8fafc',
          '&::placeholder': { color: '#64748b', opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#94a3b8',
          '&.Mui-focused': { color: '#60a5fa' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})
