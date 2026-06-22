$content = Get-Content -Path "d:\课程表小程序\classList\src\pages\index\index.tsx" -Raw
$content = $content -replace '宸ュ叿鍑芥暟', '工具函数'
$content = $content -replace '绫诲瀷瀹氫箟', '类型定义'
$content = $content -replace '鏈\?', '月'
$content = $content -replace '鏃\$', '日'
$content = $content -replace 'return \${y}--;', 'return \`\-\${m}-\${day}\`;'
$content = $content -replace 'return \${d\.getMonth\(\) \+ 1\}月日;', 'return \`\月\${d.getDate()}日\`;'
$content = $content -replace 'return \${String\(totalHours\)\.padStart\(2, ''0''\)}:;', 'return \`\:\${String(minutes).padStart(2, ''0'')}\`;'
[System.IO.File]::WriteAllText("d:\课程表小程序\classList\src\pages\index\index.tsx", $content, [System.Text.Encoding]::UTF8)
Write-Host "文件修复完成"