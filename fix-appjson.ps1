$content = Get-Content -Path "d:\课程表小程序\classList\dist\app.json" -Raw
$content = $content -replace '鑻辫鎺掕琛\?', '英语排课表'
$content = $content -replace '鎺掕', '排课'
$content = $content -replace '鏁欏笀', '教师'
$content = $content -replace '瀛︾敓', '学生'
$content = $content -replace '璇剧▼', '课程'
[System.IO.File]::WriteAllText("d:\课程表小程序\classList\dist\app.json", $content, [System.Text.Encoding]::UTF8)
Write-Host "app.json 已修复"