import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Healthcare compliance specific settings */
    /* Longer timeout for AI processing workflows */
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    /* Accessibility testing */
    colorScheme: 'light',
    
    /* Security testing - disable web security for testing */
    ignoreHTTPSErrors: true,
    
    /* Healthcare data privacy - clear cookies between tests */
    storageState: undefined,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Healthcare compliance requires modern browser features */
        channel: 'chrome',
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports for healthcare professionals on-the-go */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers for enterprise healthcare environments */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },

    /* Accessibility testing with high contrast */
    {
      name: 'chromium-high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        forcedColors: 'active',
      },
    },

    /* Performance testing configuration */
    {
      name: 'performance-testing',
      use: {
        ...devices['Desktop Chrome'],
        /* Throttle network for performance testing */
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
        },
      },
    },
  ],

  /* Global setup and teardown for healthcare compliance testing */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      /* Healthcare compliance test environment variables */
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'healthcare-compliance-test',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'healthcare-compliance-test.firebaseapp.com',
      /* Disable analytics in test environment */
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'false',
      /* Enable test mode for compliance features */
      NEXT_PUBLIC_TEST_MODE: 'true',
    },
  },

  /* Healthcare compliance specific test configuration */
  expect: {
    /* Longer timeout for AI processing and compliance calculations */
    timeout: 10000,
    /* Screenshot comparison threshold for UI consistency */
    threshold: 0.2,
  },

  /* Test timeout for complex healthcare workflows */
  timeout: 60000,

  /* Output directory for test artifacts */
  outputDir: 'test-results/artifacts',

  /* Metadata for healthcare compliance reporting */
  metadata: {
    project: 'Healthcare Compliance SaaS',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    compliance_frameworks: [
      'FDA QMSR',
      'ISO 13485', 
      'IEC 62304',
      'ISO 14971',
      'ISO 27001',
      'HIPAA',
      'GDPR',
      '21 CFR Part 11'
    ],
    test_categories: [
      'Authentication & Authorization',
      'Compliance Workflows',
      'AI-Powered Features',
      'Security Monitoring',
      'Audit Trail',
      'Accessibility',
      'Performance',
      'Mobile Responsiveness'
    ],
  },
})
