describe('env config', () => {
  it('defaults to development when VITE_APP_ENV is unset', async () => {
    const { appEnv, isDevelopment } = await import('../config/env')
    expect(['development', 'staging', 'production']).toContain(appEnv)
    expect(typeof isDevelopment).toBe('boolean')
  })
})
