# API Testing Script - PowerShell
# Tests all 30 autonomous analytics API endpoints

$baseUrl = "http://localhost:3000"
$brandId = "test_brand_001"
$userId = "test_user_001"

# Test results
$results = @()
$passed = 0
$failed = 0

Write-Host ""
Write-Host "=== AUTONOMOUS ANALYTICS API TESTING ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host "Brand ID: $brandId" -ForegroundColor Gray
Write-Host ""function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction Stop
        } else {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Body $jsonBody -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
        }
        
        if ($response.StatusCode -eq 200) {
            Write-Host " PASS" -ForegroundColor Green
            $script:passed++
            return @{
                Name = $Name
                Status = "PASS"
                StatusCode = $response.StatusCode
                Response = $response.Content | ConvertFrom-Json
            }
        } else {
            Write-Host " FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            $script:failed++
            return @{
                Name = $Name
                Status = "FAIL"
                StatusCode = $response.StatusCode
                Error = "Unexpected status code"
            }
        }
    } catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return @{
            Name = $Name
            Status = "FAIL"
            Error = $_.Exception.Message
        }
    }
}

# ===== TRUST APIs =====
Write-Host "`n--- TRUST APIs (3) ---" -ForegroundColor Yellow

$results += Test-Endpoint `
    -Name "Get Trust Metrics" `
    -Url "$baseUrl/api/autonomous-analytics/trust/metrics?brandId=$brandId"

$results += Test-Endpoint `
    -Name "Get Trust Score" `
    -Url "$baseUrl/api/autonomous-analytics/trust/score?brandId=$brandId"

$results += Test-Endpoint `
    -Name "Get Trust Trend" `
    -Url "$baseUrl/api/autonomous-analytics/trust/trend?brandId=$brandId"

# ===== BUDGET APIs =====
Write-Host "`n--- BUDGET APIs (2) ---" -ForegroundColor Yellow

$results += Test-Endpoint `
    -Name "Get Budget Consumption" `
    -Url "$baseUrl/api/autonomous-analytics/budget/consumption?brandId=$brandId&period=daily"

$results += Test-Endpoint `
    -Name "Get Per-Rule Budget" `
    -Url "$baseUrl/api/autonomous-analytics/budget/per-rule?brandId=$brandId"

# ===== DASHBOARD APIs =====
Write-Host "`n--- DASHBOARD APIs (3) ---" -ForegroundColor Yellow

$results += Test-Endpoint `
    -Name "Get Autonomy Exposure" `
    -Url "$baseUrl/api/autonomous-analytics/dashboard/exposure?brandId=$brandId"

$results += Test-Endpoint `
    -Name "Get Risk Heatmap" `
    -Url "$baseUrl/api/autonomous-analytics/dashboard/heatmap?brandId=$brandId"

# Skip kill switch test (destructive)
Write-Host "Testing: Activate Kill Switch..." -NoNewline
Write-Host " SKIP (Destructive)" -ForegroundColor Yellow

# ===== RULES APIs =====
Write-Host "`n--- RULES APIs (6) ---" -ForegroundColor Yellow

$results += Test-Endpoint `
    -Name "Get Rules List" `
    -Url "$baseUrl/api/autonomous-analytics/rules?brandId=$brandId&level=all&status=all"

$results += Test-Endpoint `
    -Name "Get Rules Summary" `
    -Url "$baseUrl/api/autonomous-analytics/rules/summary?brandId=$brandId"

# Skip rule-specific tests (need real rule ID)
Write-Host "Testing: Get Rule Details..." -NoNewline
Write-Host " SKIP (Need rule ID)" -ForegroundColor Yellow

Write-Host "Testing: Expand Rule..." -NoNewline
Write-Host " SKIP (Need rule ID)" -ForegroundColor Yellow

Write-Host "Testing: Demote Rule..." -NoNewline
Write-Host " SKIP (Need rule ID)" -ForegroundColor Yellow

Write-Host "Testing: Pause Rule..." -NoNewline
Write-Host " SKIP (Need rule ID)" -ForegroundColor Yellow

# ===== APPROVALS APIs =====
Write-Host "`n--- APPROVALS APIs (5) ---" -ForegroundColor Yellow

$results += Test-Endpoint `
    -Name "Get Pending Approvals" `
    -Url "$baseUrl/api/autonomous-analytics/approvals/pending?brandId=$brandId"

$results += Test-Endpoint `
    -Name "Get Approval History" `
    -Url "$baseUrl/api/autonomous-analytics/approvals/history?brandId=$brandId"

# Skip approval-specific tests
Write-Host "Testing: Get Approval Details..." -NoNewline
Write-Host " SKIP (Need approval ID)" -ForegroundColor Yellow

Write-Host "Testing: Approve Request..." -NoNewline
Write-Host " SKIP (Need approval ID)" -ForegroundColor Yellow

Write-Host "Testing: Reject Request..." -NoNewline
Write-Host " SKIP (Need approval ID)" -ForegroundColor Yellow

# ===== EXECUTIONS APIs =====
Write-Host "`n--- EXECUTIONS APIs (4) ---" -ForegroundColor Yellow

$results += Test-Endpoint `
    -Name "Get Executions List" `
    -Url "$baseUrl/api/autonomous-analytics/executions?brandId=$brandId&dateRange=7days&status=all"

$results += Test-Endpoint `
    -Name "Get Recent Executions" `
    -Url "$baseUrl/api/autonomous-analytics/executions/recent?brandId=$brandId"

# Skip execution-specific tests
Write-Host "Testing: Get Execution Details..." -NoNewline
Write-Host " SKIP (Need execution ID)" -ForegroundColor Yellow

Write-Host "Testing: Rollback Execution..." -NoNewline
Write-Host " SKIP (Need execution ID)" -ForegroundColor Yellow

# ===== AUDIT APIs =====
Write-Host "`n--- AUDIT APIs (3) ---" -ForegroundColor Yellow

$results += Test-Endpoint `
    -Name "Get Audit Logs" `
    -Url "$baseUrl/api/autonomous-analytics/audit/logs?brandId=$brandId&dateRange=7days&eventType=all"

$results += Test-Endpoint `
    -Name "Export CSV" `
    -Url "$baseUrl/api/autonomous-analytics/audit/export/csv?brandId=$brandId&dateRange=7days"

$results += Test-Endpoint `
    -Name "Export PDF" `
    -Url "$baseUrl/api/autonomous-analytics/audit/export/pdf?brandId=$brandId&dateRange=7days"

# ===== SETTINGS APIs =====
Write-Host "`n--- SETTINGS APIs (4) ---" -ForegroundColor Yellow

$results += Test-Endpoint `
    -Name "Get Settings" `
    -Url "$baseUrl/api/autonomous-analytics/settings?brandId=$brandId"

# Skip destructive settings tests
Write-Host "Testing: Toggle Autonomy Level..." -NoNewline
Write-Host " SKIP (Destructive)" -ForegroundColor Yellow

Write-Host "Testing: Emergency Pause..." -NoNewline
Write-Host " SKIP (Destructive)" -ForegroundColor Yellow

Write-Host "Testing: Update Budget Limits..." -NoNewline
Write-Host " SKIP (Destructive)" -ForegroundColor Yellow

# ===== SUMMARY =====
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Tested: $($passed + $failed)" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Skipped: $((30 - $passed - $failed))" -ForegroundColor Yellow

if ($failed -eq 0) {
    Write-Host "All tested endpoints PASSED! v" -ForegroundColor Green
} else {
    Write-Host "Some endpoints FAILED. Review errors above." -ForegroundColor Red
}

# Show failed tests details
if ($failed -gt 0) {
    Write-Host "=== FAILED TESTS ===" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "- $($_.Name)" -ForegroundColor Red
        if ($_.Error) {
            Write-Host "  Error: $($_.Error)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
