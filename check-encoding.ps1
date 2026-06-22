# 读取源文件并检查编码
 = "d:\课程表小程序\classList\src\pages\index\index.tsx"
 = Get-Content -Path  -Raw -Encoding UTF8

# 验证内容
Write-Host "文件内容预览（前20行）:"
 -split "
" | Select-Object -First 20

# 写入时确保UTF-8编码（带BOM）
[System.IO.File]::WriteAllText(, , [System.Text.Encoding]::UTF8)
Write-Host "文件已重新保存为UTF-8编码"