$content = Get-Content -Path "d:\课程表小程序\classList\src\pages\index\index.tsx" -Raw
$content = $content -replace 'function fmtDate\(d: Date\): string \{[\s\S]*?return \\\\\.+?\\\\\;\}', 'function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, ''0'');
  const day = String(d.getDate()).padStart(2, ''0'');
  return \\\\-\${m}-\${day}\\\;
}'
$content = $content -replace 'function fmtDisplay\(d: Date\): string \{[\s\S]*?return \\\\\.+?\\\\\;\}', 'function fmtDisplay(d: Date): string {
  return \\\\月\${d.getDate()}日\\\;
}'
$content = $content -replace 'function addHours\(timeStr: string, hours: number\): string \{[\s\S]*?return \\\\\.+?\\\\\;\}', 'function addHours(timeStr: string, hours: number): string {
  const \[hoursStr, minutesStr\] = timeStr.split(''\\: '');
  let totalHours = parseInt(hoursStr) + hours;
  const minutes = parseInt(minutesStr);
  totalHours = totalHours % 24;
  return \\\\:\${String(minutes).padStart(2, ''0'')}\\\;
}'
[System.IO.File]::WriteAllText("d:\课程表小程序\classList\src\pages\index\index.tsx", $content, [System.Text.Encoding]::UTF8)
Write-Host "文件修复完成"