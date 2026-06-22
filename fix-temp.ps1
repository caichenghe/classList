$content = Get-Content -Path "d:\课程表小程序\classList\src\pages\index\index.tsx" -Raw
$content = $content -replace 'return \\\\\\\-\\\-\\\\\\\\;', 'return \\\\-\${m}-\${day}\\\;'
$content = $content -replace 'return \\\\\\\月\\\\\日\\\\\;', 'return \\\\月\${d.getDate()}日\\\;'
$content = $content -replace 'return \\\\\\\:\\\\\\\\;', 'return \\\\:\${String(minutes).padStart(2, ''''0'''')}\\\;'
[System.IO.File]::WriteAllText("d:\课程表小程序\classList\src\pages\index\index.tsx", $content, [System.Text.Encoding]::UTF8)
Write-Host "文件修复完成"