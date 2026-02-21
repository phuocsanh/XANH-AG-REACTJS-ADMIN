"use client"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ConfigProvider } from "antd"
import themeConfig from "@/config/theme-config"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import muiTheme from "@/config/mui-theme-config"

// eslint-disable-next-line react-refresh/only-export-components
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function AppProviderTanStack({ children }: { children: React.ReactNode }) {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={themeConfig} wave={{ disabled: true }}>
        <MuiThemeProvider theme={muiTheme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
export default AppProviderTanStack
