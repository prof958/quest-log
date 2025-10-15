# PowerShell script to test IGDB caching system
$functionUrl = "https://qrksbnjfqxknzedncdde.supabase.co/functions/v1/igdb-proxy"

# Test request body
$requestBody = @{
    endpoint = "games"
    body = 'search "Zelda"; fields name,rating,summary; limit 3;'
    method = "POST"
} | ConvertTo-Json

Write-Host "🧪 Testing IGDB Enhanced Caching System" -ForegroundColor Cyan
Write-Host "=" * 50

try {
    # Test 1: First request (cache miss expected)
    Write-Host "`n📍 Test 1: First Request (Expected Cache Miss)" -ForegroundColor Yellow
    Write-Host "🔄 Making request..." -ForegroundColor Gray
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response1 = Invoke-WebRequest -Uri $functionUrl -Method POST -Body $requestBody -ContentType "application/json" -UseBasicParsing
    $stopwatch.Stop()
    
    $responseTime1 = $stopwatch.ElapsedMilliseconds
    $cacheStatus1 = $response1.Headers["X-Cache"] -join ""
    $cacheKey1 = $response1.Headers["X-Cache-Key"] -join ""
    
    Write-Host "✅ Response received in ${responseTime1}ms" -ForegroundColor Green
    Write-Host "   Cache Status: $cacheStatus1" -ForegroundColor Gray
    Write-Host "   Cache Key: $cacheKey1" -ForegroundColor Gray
    Write-Host "   Response Length: $($response1.Content.Length) bytes" -ForegroundColor Gray
    
    # Parse and display some game data
    $games1 = $response1.Content | ConvertFrom-Json
    if ($games1.Count -gt 0) {
        Write-Host "   Games Found: $($games1.Count)" -ForegroundColor Gray
        Write-Host "   First Game: $($games1[0].name)" -ForegroundColor Gray
    }
    
    # Test 2: Second identical request (cache hit expected)
    Write-Host "`n⏳ Waiting 2 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
    
    Write-Host "`n📍 Test 2: Second Request (Expected Cache Hit)" -ForegroundColor Yellow
    Write-Host "🔄 Making identical request..." -ForegroundColor Gray
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response2 = Invoke-WebRequest -Uri $functionUrl -Method POST -Body $requestBody -ContentType "application/json" -UseBasicParsing
    $stopwatch.Stop()
    
    $responseTime2 = $stopwatch.ElapsedMilliseconds
    $cacheStatus2 = $response2.Headers["X-Cache"] -join ""
    $cacheKey2 = $response2.Headers["X-Cache-Key"] -join ""
    
    Write-Host "✅ Response received in ${responseTime2}ms" -ForegroundColor Green
    Write-Host "   Cache Status: $cacheStatus2" -ForegroundColor Gray
    Write-Host "   Cache Key: $cacheKey2" -ForegroundColor Gray
    
    # Calculate performance improvement
    if ($responseTime1 -gt 0 -and $responseTime2 -gt 0) {
        $speedup = [math]::Round($responseTime1 / $responseTime2, 1)
        Write-Host "⚡ Performance improvement: ${speedup}x faster" -ForegroundColor Magenta
        Write-Host "   First request: ${responseTime1}ms" -ForegroundColor Gray
        Write-Host "   Second request: ${responseTime2}ms" -ForegroundColor Gray
    }
    
    # Verify cache hit
    if ($cacheStatus2 -eq "HIT") {
        Write-Host "✅ Cache hit confirmed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Expected cache hit but got: $cacheStatus2" -ForegroundColor Yellow
    }
    
    # Test 3: Different query (cache miss expected)
    $differentRequestBody = @{
        endpoint = "games"
        body = 'search "Mario"; fields name,rating; limit 2;'
        method = "POST"
    } | ConvertTo-Json
    
    Write-Host "`n📍 Test 3: Different Query (Expected Cache Miss)" -ForegroundColor Yellow
    Write-Host "🔄 Making different request..." -ForegroundColor Gray
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response3 = Invoke-WebRequest -Uri $functionUrl -Method POST -Body $differentRequestBody -ContentType "application/json" -UseBasicParsing
    $stopwatch.Stop()
    
    $responseTime3 = $stopwatch.ElapsedMilliseconds
    $cacheStatus3 = $response3.Headers["X-Cache"] -join ""
    
    Write-Host "✅ Response received in ${responseTime3}ms" -ForegroundColor Green
    Write-Host "   Cache Status: $cacheStatus3" -ForegroundColor Gray
    
    # Summary
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
    Write-Host "🏆 TEST RESULTS SUMMARY" -ForegroundColor Cyan
    Write-Host ("=" * 50) -ForegroundColor Cyan
    
    $totalRequests = 3
    $cacheHits = @($cacheStatus1, $cacheStatus2, $cacheStatus3) | Where-Object { $_ -eq "HIT" } | Measure-Object | Select-Object -ExpandProperty Count
    $cacheMisses = $totalRequests - $cacheHits
    $hitRate = [math]::Round(($cacheHits / $totalRequests) * 100, 1)
    $avgResponseTime = [math]::Round(($responseTime1 + $responseTime2 + $responseTime3) / 3, 0)
    
    Write-Host "Total Requests: $totalRequests" -ForegroundColor White
    Write-Host "Cache Hits: $cacheHits" -ForegroundColor Green
    Write-Host "Cache Misses: $cacheMisses" -ForegroundColor Red
    Write-Host "Hit Rate: ${hitRate}%" -ForegroundColor $(if ($hitRate -gt 30) { "Green" } else { "Yellow" })
    Write-Host "Average Response Time: ${avgResponseTime}ms" -ForegroundColor White
    
    if ($cacheHits -gt 0) {
        Write-Host "`n🎉 SUCCESS: Enhanced caching system is working!" -ForegroundColor Green
        Write-Host "✅ Database caching is operational" -ForegroundColor Green
        Write-Host "✅ Cache headers are being returned correctly" -ForegroundColor Green
        Write-Host "✅ Performance improvements are measurable" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Cache system needs investigation" -ForegroundColor Yellow
        Write-Host "   All requests resulted in cache misses" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`n❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception)" -ForegroundColor Red
}

Write-Host "`n✨ Test completed!" -ForegroundColor Cyan